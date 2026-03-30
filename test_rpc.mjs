import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.rpc('execute_report_query', {
    query_text: 'SELECT count(*) AS "Total Ventas" FROM sales WHERE DATE(created_at) = CURRENT_DATE;'
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

main();
