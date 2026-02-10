// File: index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.38.0';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const department = url.searchParams.get('department');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let query = supabaseClient
      .from('employee_contacts')
      .select('*')
      .order('name');

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ data }),
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
