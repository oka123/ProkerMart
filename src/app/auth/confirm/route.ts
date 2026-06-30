import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Jika Supabase mengirimkan pesan error (misal: link sudah expired atau pernah dipakai)
  if (errorParam || errorDescription) {
    redirect(
      `/auth/error?error=${encodeURIComponent(errorDescription || errorParam || "Tautan konfirmasi tidak valid atau kadaluarsa.")}`,
    );
  }

  const supabase = await createClient();

  // 1. Jika Supabase melakukan verifikasi via API-nya sendiri dan me-redirect dengan parameter "code" (PKCE Flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // 2. Jika email template diarahkan langsung ke aplikasi ini dengan "token_hash"
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // 3. Jika tidak ada parameter code/token_hash dan TIDAK ADA error,
  // kemungkinan ini adalah balikan Implicit Flow (menggunakan hash fragment #access_token)
  // atau user hanya sekadar kembali ke halaman ini setelah sukses.
  // Jadi kita alihkan ke halaman utama (atau halaman login) alih-alih menampilkan error.
  redirect(next);
}
