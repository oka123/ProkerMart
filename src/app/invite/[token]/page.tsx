"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, Building2 } from "lucide-react";
import { getInvitation, acceptInvitation } from "./actions";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

interface InviteData {
  id: string;
  email: string;
  jabatan: string;
  organisasi?: { nama_organisasi: string };
  sub_toko?: { nama_proker: string };
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getInvitation(token);
        if (!data) {
          setError("Undangan tidak ditemukan, sudah digunakan, atau tidak valid.");
        } else {
          setInvite(data.invite);
          setIsRegistered(data.isRegistered);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    const res = await acceptInvitation(token);
    setAccepting(false);

    if (res.success) {
      // Refresh the session so the new role is reflected immediately
      const supabase = createClient();
      await supabase.auth.refreshSession();

      if (res.isProker) {
        router.push("/dashboard");
      } else {
        router.push("/org-dashboard");
      }
    } else {
      // If error is login required, redirect to login
      if (res.error?.includes("login")) {
        router.push(`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
      } else {
        alert(res.error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm text-center border border-slate-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Gagal Memuat Undangan</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/" className="text-primary-600 font-semibold hover:underline">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const roleName = invite.jabatan.replace(/_/g, " ");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Logo className="mb-8" />
      
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Undangan Bergabung</h1>
          <p className="text-slate-500">
            Anda telah diundang untuk bergabung ke organisasi{" "}
            <strong className="text-slate-800">{invite.organisasi?.nama_organisasi}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-slate-500">Email:</div>
            <div className="font-medium text-slate-900 truncate">{invite.email}</div>
            <div className="text-slate-500">Jabatan:</div>
            <div className="font-medium text-slate-900 capitalize">{roleName}</div>
            <div className="text-slate-500">Penugasan:</div>
            <div className="font-medium text-slate-900">
              {invite.sub_toko ? invite.sub_toko.nama_proker : "Pengurus Inti"}
            </div>
          </div>
        </div>

        {isRegistered ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Email Anda sudah terdaftar di ProkerMart. Silakan terima undangan ini untuk langsung masuk.</p>
            </div>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {accepting ? "Menerima..." : "Terima Undangan"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-100">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Email ini belum terdaftar di ProkerMart. Anda harus membuat akun terlebih dahulu untuk menerima undangan.</p>
            </div>
            <Link
              href={`/auth/sign-up?email=${encodeURIComponent(invite.email)}&redirect=${encodeURIComponent(`/invite/${token}`)}`}
              className="w-full block text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Daftar Akun Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
