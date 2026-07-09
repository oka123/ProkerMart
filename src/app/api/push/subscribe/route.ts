import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription data or missing endpoint" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        id_pengguna: userId || null,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[Push Subscribe API] DB Error:", error);
      return NextResponse.json({ error: "Database error", details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Subscribe API] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
