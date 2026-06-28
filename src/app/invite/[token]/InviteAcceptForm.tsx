"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2, Mail, UserPlus, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InvitationInfo = {
  email: string;
  role: string;
  status: string;
  expires_at: string | null;
  sub_toko_name: string;
};

const ROLE_DISPLAY: Record<string, string> = {
  KetuaProker: "Ketua Proker",
  WakilProker: "Wakil Proker",
  SekretarisProker: "Sekretaris Proker",
  BendaharaProker: "Bendahara Proker",
  KoorPenggalianDana: "Koor Penggalian Dana",
  WakilKoorPenggalianDana: "Wakil Koor Penggalian Dana",
  AnggotaPenggalianDana: "Anggota Penggalian Dana",
};

export default function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [invite, setInvite] = useState<InvitationInfo | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const inviteUrl = typeof window !== "undefined" ? `/invite/${token}` : `/invite/${token}`;

  // Check auth + fetch invite info
  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      fetch(`/api/invitations/info?token=${encodeURIComponent(token)}`),
    ]).then(async ([{ data: { user } }, infoRes]) => {
      setUserEmail(user?.email ?? null);
      setAuthLoading(false);

      if (!infoRes.ok) {
        const d = await infoRes.json();
        setFetchError(d.error || "Undangan tidak dapat dimuat.");
        return;
      }
      const d = await infoRes.json();
      setInvite(d.invitation);
    });
  }, [token, supabase]);

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);
    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setAccepting(false);
    if (!res.ok) {
      setAcceptError(data.error || "Terjadi kesalahan.");
      return;
    }
    setDone(true);
    // Clear role cache so SwitchRoleButton re-fetches
    sessionStorage.removeItem("switch_role_access");
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  if (authLoading) return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md mx-auto text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-3" />
      <p className="text-slate-500 text-sm">Memuat undangan...</p>
    </div>
  );

  if (fetchError) return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md mx-auto text-center space-y-3">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
      <h1 className="text-xl font-bold text-slate-900">Undangan Tidak Valid</h1>
      <p className="text-sm text-slate-500">{fetchError}</p>
    </div>
  );

  if (!invite) return null;

  const isExpired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
  const isPending = invite.status === "pending" && !isExpired;
  const roleLabel = ROLE_DISPLAY[invite.role] ?? invite.role;

  if (done) return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md mx-auto text-center space-y-4">
      <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
      <h1 className="text-xl font-bold text-slate-900">Undangan Diterima!</h1>
      <p className="text-sm text-slate-500">
        Anda sekarang menjadi <strong>{roleLabel}</strong> di <strong>{invite.sub_toko_name}</strong>.
        Mengarahkan ke dashboard...
      </p>
    </div>
  );

  if (!isPending) return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md mx-auto text-center space-y-3">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
      <h1 className="text-xl font-bold text-slate-900">Undangan Tidak Aktif</h1>
      <p className="text-sm text-slate-500">
        {isExpired ? "Undangan ini sudah kadaluarsa." : "Undangan ini sudah dikonfirmasi atau tidak lagi tersedia."}
      </p>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Undangan Tim Proker</h1>
        <p className="text-sm text-slate-500">Anda diundang bergabung ke sub toko berikut</p>
      </div>

      {/* Info card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Sub Toko</span>
          <span className="font-semibold text-slate-800">{invite.sub_toko_name}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Jabatan</span>
          <span className="font-semibold text-slate-800">{roleLabel}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Email Diundang</span>
          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{invite.email}</span>
        </div>
        {invite.expires_at && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Berlaku Hingga</span>
            <span className="text-slate-600">{new Date(invite.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        )}
      </div>

      {/* Auth-aware CTA */}
      {userEmail === null ? (
        // Not logged in
        <div className="space-y-3">
          <p className="text-sm text-center text-slate-500">
            Login atau daftar akun dengan email <strong>{invite.email}</strong> untuk menerima undangan ini.
          </p>
          <Link
            href={`/auth/sign-up?redirect=${encodeURIComponent(inviteUrl)}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Daftar Akun Baru
          </Link>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(inviteUrl)}`}
            className="flex items-center justify-center gap-2 w-full py-3 border border-slate-300 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors text-sm"
          >
            <LogIn className="w-4 h-4" /> Sudah Punya Akun? Masuk
          </Link>
        </div>
      ) : userEmail.toLowerCase() !== invite.email.toLowerCase() ? (
        // Wrong account
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 text-center">
            Anda login sebagai <strong>{userEmail}</strong>, tetapi undangan ini untuk <strong>{invite.email}</strong>.
            Silakan logout dan login dengan akun yang sesuai.
          </div>
        </div>
      ) : (
        // Correct account — accept
        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {accepting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : <><CheckCircle className="w-4 h-4" /> Terima Undangan</>}
          </button>
          {acceptError && (
            <p className="text-sm text-red-600 text-center">{acceptError}</p>
          )}
        </div>
      )}
    </div>
  );
}
