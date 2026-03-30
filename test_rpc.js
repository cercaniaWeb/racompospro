const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking DB...");
    const { data: res1, error: err1 } = await supabase.rpc('execute_report_query', {
        query_text: 'SELECT count(*) AS "Total" FROM sales;'
    });
    console.log('sales result:', res1);
    
    const { data: res2, error: err2 } = await supabase.rpc('execute_report_query', {
        query_text: 'SELECT count(*) AS "Total" FROM tickets;'
    });
    console.log('tickets result:', res2);
}

main().catch(console.error);
