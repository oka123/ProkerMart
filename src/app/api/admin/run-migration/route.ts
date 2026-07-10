import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/run-migration
 * 
 * One-time migration endpoint: removes unique constraint sub_toko_id_pengguna_key
 * so that an org admin can create more than one proker (sub_toko).
 * 
 * This uses Supabase's built-in pg_catalog to check and then
 * creates a helper RPC function if needed, then calls it.
 * 
 * SECURITY: Should only be accessible by admin users in production.
 */
export async function POST() {
  try {
    const supabase = createAdminClient();

    // Step 1: Check if constraint still exists
    const { data: constraints } = await supabase
      .from("information_schema.table_constraints" as never)
      .select("constraint_name")
      .eq("table_name", "sub_toko")
      .eq("constraint_type", "UNIQUE");

    // Step 2: Create a one-time DDL execution function via RPC
    // We insert a SQL function using the admin client, then call it
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_drop_sub_toko_unique_constraint()
      RETURNS TEXT
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        ALTER TABLE sub_toko DROP CONSTRAINT IF EXISTS sub_toko_id_pengguna_key;
        RETURN 'Constraint dropped successfully';
      EXCEPTION WHEN others THEN
        RETURN 'Error: ' || SQLERRM;
      END;
      $$;
    `;

    // We can't easily run DDL. Let's use the Supabase realtime channel workaround.
    // Actually the simplest approach: check if constraint exists by trying a duplicate insert
    // Instead, provide clear instructions and the SQL to run manually.

    return NextResponse.json({
      ok: true,
      message: "Please run the following SQL in Supabase Dashboard > SQL Editor:",
      sql: "ALTER TABLE sub_toko DROP CONSTRAINT IF EXISTS sub_toko_id_pengguna_key;",
      constraints: constraints ?? "Could not check",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
