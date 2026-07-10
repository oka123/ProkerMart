import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://dpvmnubuvrqzehbjnnyd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm1udWJ1dnJxemVoYmpubnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTc0MjUsImV4cCI6MjA5NDIzMzQyNX0.9Rk6vFNuXQvTjTlookNTJVaC1hwN_9d1YhhHBYute68');

async function test() {
  const { data, error } = await supabase.from('sub_toko').select('*').limit(1);
  console.log("Data:", data, "Error:", error);
  if (data && data.length > 0) {
    const id = data[0].id_sub_toko;
    console.log("Trying to delete sub_toko:", id);
    const del = await supabase.from('sub_toko').delete().eq('id_sub_toko', id);
    console.log("Delete result:", del);
  }
}
test();
