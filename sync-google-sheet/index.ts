import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.38.0';
import { google } from "npm:googleapis@^128.0.0";

// ⚠️ REPLACE THIS WITH YOUR SHEET ID ⚠️
const SHEET_ID = '17iE9Iu9BJJMfTMkPL9oxv2JofE8x7wDN4QMl-0yok7A';

Deno.serve(async (req) => {
  try {
    console.log('🚀 Starting bi-directional sync...');
    const startTime = Date.now();
    
    // 1. Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: Deno.env.get('GOOGLE_TYPE'),
        private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 2. Supabase connection
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ===== PART 1: Google Sheet → Supabase =====
    console.log('📥 Syncing from Google Sheet to Supabase...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'A:E',
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} rows in Google Sheet`);
    
    let sheetToDb = { added: 0, updated: 0 };
    const now = new Date().toISOString();
    
    if (rows.length > 1) {
      const dataRows = rows.slice(1); // Skip header
      
      for (const row of dataRows) {
        const sheetId = row[0] || '';
        const name = row[1] || '';
        const email = row[2] || '';
        
        if (!name || !email) continue;
        
        // Check if exists in Supabase
        const { data: existing } = await supabase
          .from('employee_contacts')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        
        if (existing) {
          // Update existing with timestamp
          await supabase.from('employee_contacts').update({
            name,
            department: row[3] || '',
            phone: row[4] || '',
            sheet_row_id: sheetId,
            updated_at: now,
            last_synced_at: now, // NEW: Track when synced
            last_synced_from: 'Saved' // NEW: Track source
          }).eq('email', email);
          sheetToDb.updated++;
        } else {
          // Insert new with timestamps
          await supabase.from('employee_contacts').insert({
            sheet_row_id: sheetId || `GS${Date.now()}`,
            name,
            email,
            department: row[3] || '',
            phone: row[4] || '',
            created_at: now,
            updated_at: now,
            last_synced_at: now, // NEW
            last_synced_from: 'Saved' // NEW
          });
          sheetToDb.added++;
        }
      }
    }
    
    console.log(`Sheet → DB: Added ${sheetToDb.added}, Updated ${sheetToDb.updated}`);
    
    // ===== PART 2: Supabase → Google Sheet =====
    console.log('📤 Syncing from Supabase to Google Sheet...');
    const { data: dbEmployees, error } = await supabase
      .from('employee_contacts')
      .select('*')
      .order('created_at');
    
    if (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }
    
    let dbToSheet = 0;
    
    if (dbEmployees && dbEmployees.length > 0) {
      // Prepare data for Google Sheets
      const values = dbEmployees.map(emp => [
        emp.sheet_row_id || `DB${emp.id.substring(0, 8)}`,
        emp.name,
        emp.email,
        emp.department || '',
        emp.phone || '',
        emp.last_synced_at || '', // Add timestamp column
        emp.last_synced_from || '' // Add source column
      ]);
      
      // Update entire sheet with extra columns for timestamps
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'A2:G', // Now includes columns F and G for timestamps
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
      
      dbToSheet = dbEmployees.length;
      console.log(`DB → Sheet: Synced ${dbToSheet} records`);
      
      // Update sync timestamp for all records
      await supabase
        .from('employee_contacts')
        .update({
          last_synced_at: now,
          last_synced_from: 'Saved'
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
    }
    
    // ===== UPDATE SYNC LOG =====
    // Create a sync log entry
    const syncDuration = Date.now() - startTime;
    
    await supabase
      .from('sync_logs') // Create this table first
      .insert({
        sync_type: 'bi_directional',
        sheet_to_db: sheetToDb.added + sheetToDb.updated,
        db_to_sheet: dbToSheet,
        duration_ms: syncDuration,
        status: 'success',
        started_at: new Date(startTime).toISOString(),
        completed_at: now
      })
      .catch(err => {
        console.log('Could not log sync (table might not exist):', err.message);
      });
    
    // ===== FINAL RESULT =====
    const result = {
      success: true,
      timestamp: now,
      sheet_to_db: sheetToDb,
      db_to_sheet: dbToSheet,
      total_in_db: dbEmployees?.length || 0,
      total_in_sheet: rows.length - 1,
      sync_duration_ms: syncDuration
    };
    
    console.log(`✅ Sync complete in ${syncDuration}ms:`, result);
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase
        .from('sync_logs')
        .insert({
          sync_type: 'bi_directional',
          sheet_to_db: 0,
          db_to_sheet: 0,
          duration_ms: 0,
          status: 'error',
          error_message: error.message,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Could not log sync error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
