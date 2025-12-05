const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gdkpwsgcqwvsxghvoqmu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3B3c2djcXd2c3hnaHZvcW11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0NjczOCwiZXhwIjoyMDc5NTIyNzM4fQ.or1zmsyzvd9RGD18eIguDMFcKshiIg10fzBsCnVXhLk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getStores() {
    const { data, error } = await supabase
        .from('stores')
        .select('id, name');

    if (error) {
        console.error('Error fetching stores:', error);
    } else {
        console.log('Stores:', JSON.stringify(data, null, 2));
    }
}

getStores();
