// File: index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.38.0';
import { google } from "npm:googleapis@^128.0.0";

const SHEET_ID = '17iE9Iu9BJJMfTMkPL9oxv2JofE8x7wDN4QMl-0yok7A';
const SHEET_RANGE = 'Sheet1!A:E';

const credentials = {
  type: Deno.env.get('GOOGLE_TYPE')!,
  project_id: Deno.env.get('GOOGLE_PROJECT_ID')!,
  private_key_id: Deno.env.get('GOOGLE_PRIVATE_KEY_ID')!,
  private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')!.replace(/\\n/g, '\n'),
  client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL')!,
  client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
  auth_uri: Deno.env.get('GOOGLE_AUTH_URI')!,
  token_uri: Deno.env.get('GOOGLE_TOKEN_URI')!,
  auth_provider_x509_cert_url: Deno.env.get('GOOGLE_AUTH_PROVIDER_CERT_URL')!,
  client_x509_cert_url: Deno.env.get('GOOGLE_CLIENT_CERT_URL')!,
};

Deno.serve(async (req) => {
  try {
    const { name, email, department, phone } = await req.json();
    
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get next available row
    const lastRow = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:A',
    });
    
    const nextRow = lastRow.data.values ? lastRow.data.values.length + 1 : 2;
    const newId = `EMP${Date.now()}`;
    
    // Add to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `Sheet1!A${nextRow}:E${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newId, name, email, department || '', phone || '']],
      },
    });

    // Add to Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabaseClient
      .from('employee_contacts')
      .insert({
        sheet_row_id: newId,
        name,
        email,
        department,
        phone,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Employee added successfully',
        data 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
