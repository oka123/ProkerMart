import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  const token = "e59ded1d-f616-44e3-8ec0-e8db0ee402a0";
  
  const { data: invite, error } = await adminClient
    .from("organisasi_invitations")
    .select("*, organisasi(nama_organisasi), sub_toko(nama_sub_toko)")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  console.log("Data:", invite);
  console.log("Error:", error);
}

test();
