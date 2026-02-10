import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { google } from "npm:googleapis@^128.0.0";

// Your Google Sheet ID
const SHEET_ID = '17iE9Iu9BJJMfTMkPL9oxv2JofE8x7wDN4QMl-0yok7A';

Deno.serve(async (req) => {
  try {
    const { operation, new_data, old_data } = await req.json();
    
    console.log(`Database ${operation} detected:`, new_data || old_data);
    
    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: Deno.env.get('GOOGLE_TYPE'),
        private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    if (operation === 'INSERT') {
      // Add new row to Google Sheet
      await addRowToSheet(sheets, new_data);
      
    } else if (operation === 'UPDATE') {
      // Update existing row in Google Sheet
      await updateRowInSheet(sheets, new_data);
      
    } else if (operation === 'DELETE') {
      // Remove row from Google Sheet
      await deleteRowFromSheet(sheets, old_data);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sheet updated for ${operation} operation` 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error updating sheet:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
async function addRowToSheet(sheets, data) {
  // Get last row to find next empty row
  const lastRow = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A:A',
  });
  
  const nextRow = lastRow.data.values ? lastRow.data.values.length + 1 : 2;
  const rowId = data.sheet_row_id || `DB${Date.now()}`;
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `A${nextRow}:E${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        rowId,
        data.name,
        data.email,
        data.department || '',
        data.phone || ''
      ]],
    },
  });
  
  console.log(`Added row ${nextRow} with ID: ${rowId}`);
}

async function updateRowInSheet(sheets, data) {
  // Find the row by sheet_row_id
  const allData = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A:E',
  });
  
  const rows = allData.data.values || [];
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === data.sheet_row_id) {
      // Found the row, update it
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `A${i+1}:E${i+1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            data.sheet_row_id,
            data.name,
            data.email,
            data.department || '',
            data.phone || ''
          ]],
        },
      });
      console.log(`Updated row ${i+1} with ID: ${data.sheet_row_id}`);
      return;
    }
  }
  
  // If not found, add as new row
  console.log('Row not found, adding as new');
  await addRowToSheet(sheets, data);
}

async function deleteRowFromSheet(sheets, data) {
  const allData = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A:E',
  });
  
  const rows = allData.data.values || [];
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === data.sheet_row_id) {
      // Clear the row (instead of deleting to preserve structure)
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: `A${i+1}:E${i+1}`,
      });
      console.log(`Cleared row ${i+1} with ID: ${data.sheet_row_id}`);
      return;
    }
  }
  
  console.log('Row not found for deletion');
}
