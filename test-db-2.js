import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://dpvmnubuvrqzehbjnnyd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm1udWJ1dnJxemVoYmpubnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTc0MjUsImV4cCI6MjA5NDIzMzQyNX0.9Rk6vFNuXQvTjTlookNTJVaC1hwN_9d1YhhHBYute68');

async function test() {
  const { data, error } = await supabase.from('sub_toko').select('*').eq('id_sub_toko', 'c1000000-0000-0000-0000-000000000003');
  console.log("Check if deleted:", data, "Error:", error);
}
test();
