import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://dpvmnubuvrqzehbjnnyd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm1udWJ1dnJxemVoYmpubnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTc0MjUsImV4cCI6MjA5NDIzMzQyNX0.9Rk6vFNuXQvTjTlookNTJVaC1hwN_9d1YhhHBYute68');

async function test() {
  const { data, error } = await supabase.rpc('get_policies');
  if(error) console.log(error);
  console.log(data);
}
test();
