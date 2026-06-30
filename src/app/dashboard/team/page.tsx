"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, UserCog, Mail, ShieldAlert, Settings2,
  Minus, Plus, ShoppingBag, Lock, MoreVertical, Trash2, X, Loader2, ClipboardList, Wifi, WifiOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";

const ROLE_DISPLAY: Record<string, string> = {
  KetuaProker: "Ketua Proker",
  WakilProker: "Wakil Proker",
  SekretarisProker: "Sekretaris Proker",
  BendaharaProker: "Bendahara Proker",
  KoorPenggalianDana: "Koor Penggalian Dana",
  WakilKoorPenggalianDana: "Wakil Koor Penggalian Dana",
  AnggotaPenggalianDana: "Anggota Penggalian Dana",
};

const INVITABLE_BY: Record<string, string[]> = {
  KetuaProker: ["WakilProker", "SekretarisProker", "BendaharaProker", "KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  WakilProker: ["KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  SekretarisProker: ["KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  BendaharaProker: ["KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  KoorPenggalianDana: ["WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  WakilKoorPenggalianDana: ["AnggotaPenggalianDana"],
  AnggotaPenggalianDana: [],
};

// Roles a user can assign when editing another member's role (WakilKoor cannot edit roles)
const EDITABLE_ROLES_BY: Record<string, string[]> = {
  KetuaProker: ["WakilProker", "SekretarisProker", "BendaharaProker", "KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  WakilProker: ["KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  SekretarisProker: ["KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  BendaharaProker: ["KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  KoorPenggalianDana: ["WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  WakilKoorPenggalianDana: [],
  AnggotaPenggalianDana: [],
};

const CAN_SET_TARGET = ["KetuaProker", "WakilProker", "SekretarisProker", "BendaharaProker", "KoorPenggalianDana", "WakilKoorPenggalianDana"];
const CAN_LOG_SALES = ["BendaharaProker", "KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"];

// Defines which roles' rekap a given role can see. "all" = everyone, "self" = own only.
const REKAP_VISIBILITY: Record<string, string[] | "all" | "self"> = {
  KetuaProker: "all",
  WakilProker: "all",
  SekretarisProker: "all",
  BendaharaProker: ["KoorPenggalianDana", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  KoorPenggalianDana: ["BendaharaProker", "WakilKoorPenggalianDana", "AnggotaPenggalianDana"],
  WakilKoorPenggalianDana: "all",
  AnggotaPenggalianDana: "self",
};

function canSeeRekap(myRole: string, myMemberId: string, targetRole: string, targetMemberId: string): boolean {
  if (myMemberId === targetMemberId) return true; // always see own rekap
  const rule = REKAP_VISIBILITY[myRole];
  if (!rule) return false;
  if (rule === "all") return true;
  if (rule === "self") return false; // self-only, already handled above
  return rule.includes(targetRole);
}

const ROLE_COLOR: Record<string, string> = {
  KetuaProker: "bg-purple-500",
  WakilProker: "bg-purple-400",
  SekretarisProker: "bg-purple-400",
  BendaharaProker: "bg-purple-400",
  KoorPenggalianDana: "bg-primary-500",
  WakilKoorPenggalianDana: "bg-primary-400",
  AnggotaPenggalianDana: "bg-slate-300",
};

const ROLE_BORDER: Record<string, string> = {
  KetuaProker: "border-purple-300",
  WakilProker: "border-purple-200",
  SekretarisProker: "border-purple-200",
  BendaharaProker: "border-purple-200",
  KoorPenggalianDana: "border-primary-300",
  WakilKoorPenggalianDana: "border-primary-200",
  AnggotaPenggalianDana: "border-slate-200",
};

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

interface Member {
  id_member: string;
  id_pengguna: string;
  name: string;
  email: string;
  role: string;
  jualanHariIni: number;
  jualanMingguIni: number;
}

interface Produk {
  id_produk: string;
  nama_produk: string;
  harga: number;
  kategori: string | null;
}

interface RekapEntry {
  id: string;
  tanggal: string;
  jumlah_item: number;
  total_harga: number;
  catatan: string | null;
  metode_pembayaran: string | null;
  produk: { nama_produk: string; harga: number } | null;
  dicatat_oleh_member: { pengguna: { nama: string } | null } | null;
  type: "offline";
}

interface OnlinePesananEntry {
  id: string;
  tanggal: string;
  total_harga: number;
  kode_unik: string;
  items: string;
  type: "online";
}

type CombinedEntry = RekapEntry | OnlinePesananEntry;

export default function TeamPage() {
  const supabase = useMemo(() => createClient(), []);
  const { active } = useDashboard();

  const currentUserRole = active?.role ?? null;
  const currentIdSubToko = active?.id_sub_toko ?? null;
  const currentIdMember = active?.id_member ?? null;
  const [currentIdPengguna, setCurrentIdPengguna] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [produkList, setProdukList] = useState<Produk[]>([]);

  const [targetMode, setTargetMode] = useState<"harian" | "mingguan">("mingguan");
  const [targetPerHari, setTargetPerHari] = useState(1);
  const [targetPerMinggu, setTargetPerMinggu] = useState(3);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMember, setInviteMember] = useState({ email: "", role: "" });
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editRoleModal, setEditRoleModal] = useState<{ id_member: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Rekap jualan offline modal
  const [rekapTarget, setRekapTarget] = useState<Member | null>(null);
  const [rekapForm, setRekapForm] = useState({ id_produk: "", jumlah_item: "1", total_harga: "", catatan: "", metode_pembayaran: "tunai" });
  const [isSubmittingRekap, setIsSubmittingRekap] = useState(false);
  const [rekapError, setRekapError] = useState<string | null>(null);

  // View rekap modal
  const [viewRekapMember, setViewRekapMember] = useState<Member | null>(null);
  const [viewRekapEntries, setViewRekapEntries] = useState<CombinedEntry[]>([]);
  const [loadingViewRekap, setLoadingViewRekap] = useState(false);

  const invitableRoles = currentUserRole ? (INVITABLE_BY[currentUserRole] ?? []) : [];
  const editableRoles = currentUserRole ? (EDITABLE_ROLES_BY[currentUserRole] ?? []) : [];
  const canAddMember = invitableRoles.length > 0;
  const canSetTarget = currentUserRole ? CAN_SET_TARGET.includes(currentUserRole) : false;
  const canLogSales = currentUserRole ? CAN_LOG_SALES.includes(currentUserRole) : false;

  const canManageMember = useCallback((memberRole: string) => {
    return invitableRoles.includes(memberRole);
  }, [invitableRoles]);

  const canEditMemberRole = useCallback((memberRole: string) => {
    return editableRoles.includes(memberRole);
  }, [editableRoles]);

  const fetchRekapCounts = useCallback(async (idSubToko: string): Promise<{ daily: Record<string, number>; weekly: Record<string, number> }> => {
    const weekStart = getWeekStart();
    const today = getToday();
    const [offlineWeekRes, offlineTodayRes, onlineWeekRes, onlineTodayRes] = await Promise.all([
      supabase.from("rekap_jualan_offline").select("id_member").eq("id_sub_toko", idSubToko).gte("tanggal", weekStart),
      supabase.from("rekap_jualan_offline").select("id_member").eq("id_sub_toko", idSubToko).eq("tanggal", today),
      supabase.from("pesanan").select("dicatat_oleh").eq("id_sub_toko", idSubToko).eq("status_pesanan", "selesai").gte("tgl_pesan", `${weekStart}T00:00:00+00:00`).not("dicatat_oleh", "is", null),
      supabase.from("pesanan").select("dicatat_oleh").eq("id_sub_toko", idSubToko).eq("status_pesanan", "selesai").gte("tgl_pesan", `${today}T00:00:00+00:00`).not("dicatat_oleh", "is", null),
    ]);

    const weekly: Record<string, number> = {};
    const daily: Record<string, number> = {};

    (offlineWeekRes.data ?? []).forEach((r: any) => { weekly[r.id_member] = (weekly[r.id_member] ?? 0) + 1; });
    (onlineWeekRes.data ?? []).forEach((r: any) => { if (r.dicatat_oleh) weekly[r.dicatat_oleh] = (weekly[r.dicatat_oleh] ?? 0) + 1; });
    (offlineTodayRes.data ?? []).forEach((r: any) => { daily[r.id_member] = (daily[r.id_member] ?? 0) + 1; });
    (onlineTodayRes.data ?? []).forEach((r: any) => { if (r.dicatat_oleh) daily[r.dicatat_oleh] = (daily[r.dicatat_oleh] ?? 0) + 1; });

    return { daily, weekly };
  }, [supabase]);

  const fetchMembers = useCallback(async (idSubToko: string) => {
    setLoadingMembers(true);
    try {
      const [memberRes, rekapCounts] = await Promise.all([
        supabase
          .from("sub_toko_member")
          .select("id_member, id_pengguna, role, pengguna(nama, email)")
          .eq("id_sub_toko", idSubToko)
          .eq("status", "active"),
        fetchRekapCounts(idSubToko),
      ]);

      setMembers(
        (memberRes.data ?? []).map((m: any) => ({
          id_member: m.id_member,
          id_pengguna: m.id_pengguna,
          name: m.pengguna?.nama ?? "—",
          email: m.pengguna?.email ?? "—",
          role: m.role,
          jualanHariIni: rekapCounts.daily[m.id_member] ?? 0,
          jualanMingguIni: rekapCounts.weekly[m.id_member] ?? 0,
        }))
      );
    } catch (err) {
      console.error("[TeamPage - fetchMembers] Error:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [supabase, fetchRekapCounts]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentIdPengguna(session.user.id);
    });
  }, [supabase]);

  useEffect(() => {
    setLoadingRole(false);
    if (!currentIdSubToko) { setLoadingMembers(false); return; }
    fetchMembers(currentIdSubToko);

    supabase
      .from("produk")
      .select("id_produk, nama_produk, harga, kategori")
      .eq("id_sub_toko", currentIdSubToko)
      .eq("status_aktif", true)
      .order("nama_produk")
      .then(({ data }) => setProdukList(data ?? []));
  }, [currentIdSubToko, fetchMembers, supabase]);

  const handleSendInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteMember.email || !inviteMember.role) return;
    setIsSendingInvite(true);
    setInviteStatus(null);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inviteMember, id_sub_toko: currentIdSubToko }),
      });
      const result = await res.json();
      if (!res.ok) { setInviteStatus(result.error || "Gagal mengirim undangan."); return; }
      setInviteStatus("Undangan berhasil dikirim.");
      setInviteMember({ email: "", role: "" });
      setShowInviteModal(false);
    } catch (err) {
      setInviteStatus(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRemoveMember = async (id_member: string) => {
    setIsRemoving(id_member);
    const { error } = await supabase
      .from("sub_toko_member")
      .update({ status: "inactive" })
      .eq("id_member", id_member);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id_member !== id_member));
    }
    setIsRemoving(null);
    setActiveMenuId(null);
  };

  const handleSaveRole = async () => {
    if (!editRoleModal || !newRole) return;
    setIsSavingRole(true);
    const { error } = await supabase
      .from("sub_toko_member")
      .update({ role: newRole })
      .eq("id_member", editRoleModal.id_member);
    if (!error) {
      setMembers((prev) =>
        prev.map((m) => m.id_member === editRoleModal.id_member ? { ...m, role: newRole } : m)
      );
    }
    setIsSavingRole(false);
    setEditRoleModal(null);
    setNewRole("");
  };

  const openViewRekap = async (member: Member) => {
    setViewRekapMember(member);
    setViewRekapEntries([]);
    setLoadingViewRekap(true);
    try {
      const [offlineRes, onlineRes] = await Promise.all([
        supabase
          .from("rekap_jualan_offline")
          .select(`
            id, tanggal, jumlah_item, total_harga, catatan, metode_pembayaran,
            produk(nama_produk, harga),
            dicatat_oleh_member:dicatat_oleh(pengguna(nama))
          `)
          .eq("id_member", member.id_member)
          .order("tanggal", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("pesanan")
          .select(`
            id_pesanan, kode_unik, total_harga, tgl_pesan,
            detail_pesanan(jumlah, produk(nama_produk))
          `)
          .eq("dicatat_oleh", member.id_member)
          .eq("status_pesanan", "selesai")
          .order("tgl_pesan", { ascending: false }),
      ]);

      if (offlineRes.error) throw offlineRes.error;
      if (onlineRes.error) throw onlineRes.error;

      const offlineEntries: CombinedEntry[] = (offlineRes.data ?? []).map((r: any) => ({ ...r, type: "offline" as const }));
      const onlineEntries: CombinedEntry[] = (onlineRes.data ?? []).map((p: any) => ({
        id: p.id_pesanan,
        tanggal: p.tgl_pesan,
        total_harga: Number(p.total_harga),
        kode_unik: p.kode_unik,
        items: (p.detail_pesanan ?? []).map((d: any) => `${d.produk?.nama_produk ?? "?"} (${d.jumlah}x)`).join(", "),
        type: "online" as const,
      }));

      // Merge and sort by date descending
      const combined = [...offlineEntries, ...onlineEntries].sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );
      setViewRekapEntries(combined);
    } catch (err) {
      console.error("[TeamPage - openViewRekap] Error:", err);
    } finally {
      setLoadingViewRekap(false);
    }
  };

  const openRekapModal = (member: Member) => {
    setRekapTarget(member);
    setRekapForm({ id_produk: "", jumlah_item: "1", total_harga: "", catatan: "", metode_pembayaran: "tunai" });
    setRekapError(null);
  };

  const handleProdukChange = (id_produk: string) => {
    const produk = produkList.find((p) => p.id_produk === id_produk);
    const qty = parseInt(rekapForm.jumlah_item) || 1;
    setRekapForm((prev) => ({
      ...prev,
      id_produk,
      total_harga: produk ? String(produk.harga * qty) : prev.total_harga,
    }));
  };

  const handleQtyChange = (val: string) => {
    const qty = parseInt(val) || 1;
    const produk = produkList.find((p) => p.id_produk === rekapForm.id_produk);
    setRekapForm((prev) => ({
      ...prev,
      jumlah_item: val,
      total_harga: produk ? String(produk.harga * qty) : prev.total_harga,
    }));
  };

  const handleSubmitRekap = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rekapTarget || !currentIdMember || !currentIdSubToko) return;
    setIsSubmittingRekap(true);
    setRekapError(null);

    try {
      if (!rekapForm.id_produk) { setRekapError("Pilih produk terlebih dahulu."); setIsSubmittingRekap(false); return; }

      const { error } = await supabase.from("rekap_jualan_offline").insert({
        id_sub_toko: currentIdSubToko,
        id_member: rekapTarget.id_member,
        id_produk: rekapForm.id_produk,
        jumlah_item: parseInt(rekapForm.jumlah_item) || 1,
        total_harga: parseFloat(rekapForm.total_harga) || 0,
        catatan: rekapForm.catatan || null,
        metode_pembayaran: rekapForm.metode_pembayaran,
        tanggal: new Date().toISOString().split("T")[0],
        dicatat_oleh: currentIdMember,
      });

      if (error) throw error;

      // Decrement stock for offline sale
      const jumlah = parseInt(rekapForm.jumlah_item) || 1;
      const { data: decremented, error: stockError } = await supabase.rpc("decrement_stock", {
        p_id_produk: rekapForm.id_produk,
        p_jumlah: jumlah,
      });
      if (stockError) {
        console.error("[TeamPage - handleSubmitRekap] Gagal update stok:", stockError.message);
      } else if (!decremented) {
        console.warn("[TeamPage - handleSubmitRekap] Stok tidak cukup untuk produk:", rekapForm.id_produk);
      }

      // Update local count
      setMembers((prev) =>
        prev.map((m) =>
          m.id_member === rekapTarget.id_member
            ? { ...m, jualanHariIni: m.jualanHariIni + 1, jualanMingguIni: m.jualanMingguIni + 1 }
            : m
        )
      );
      setRekapTarget(null);
    } catch (err: any) {
      console.error("[TeamPage - handleSubmitRekap] Error:", err);
      setRekapError(err?.message ?? "Gagal menyimpan rekap.");
    } finally {
      setIsSubmittingRekap(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20" onClick={() => setActiveMenuId(null)}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tim Kepanitiaan & Jadwal</h1>
          <p className="text-sm text-slate-500">Kelola anggota divisi sesuai dengan tingkat jabatan dan wewenang.</p>
        </div>
        {canAddMember ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowInviteModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Undang Anggota
          </button>
        ) : (
          <button disabled className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 cursor-not-allowed border border-slate-200">
            <Lock className="w-4 h-4" /> Tidak Ada Akses Mengundang
          </button>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Undang Anggota Proker</h2>
                    <p className="text-sm text-slate-500">Isi data anggota baru untuk mengundangnya ke tim.</p>
                  </div>
                  <button onClick={() => setShowInviteModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Email Undangan</label>
                    <input type="email" value={inviteMember.email} onChange={(e) => setInviteMember({ ...inviteMember, email: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="contoh@kampus.ac.id" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Jabatan</label>
                    <select value={inviteMember.role} onChange={(e) => setInviteMember({ ...inviteMember, role: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                      <option value="" disabled>Pilih jabatan</option>
                      {invitableRoles.map((v) => <option key={v} value={v}>{ROLE_DISPLAY[v] ?? v}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setShowInviteModal(false)}
                      className="rounded-2xl border border-slate-300 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                    <button type="submit" disabled={isSendingInvite}
                      className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSendingInvite ? "Mengirim..." : "Kirim Undangan"}
                    </button>
                  </div>
                </form>
                {inviteStatus && <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">{inviteStatus}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editRoleModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setEditRoleModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Ubah Jabatan</h2>
                <button onClick={() => setEditRoleModal(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white mb-4">
                <option value="" disabled>Pilih jabatan baru</option>
                {editableRoles.map((v) => <option key={v} value={v}>{ROLE_DISPLAY[v] ?? v}</option>)}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEditRoleModal(null)}
                  className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">Batal</button>
                <button onClick={handleSaveRole} disabled={!newRole || isSavingRole}
                  className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  {isSavingRole && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rekap Jualan Offline Modal */}
      <AnimatePresence>
        {rekapTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setRekapTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-slate-900">Rekap Jualan Offline</h2>
                <button onClick={() => setRekapTarget(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Catat penjualan offline untuk <strong>{rekapTarget.name}</strong>
              </p>
              <form onSubmit={handleSubmitRekap} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Produk</label>
                  {produkList.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Belum ada produk aktif di katalog.
                    </p>
                  ) : (
                    <select
                      value={rekapForm.id_produk}
                      onChange={(e) => handleProdukChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      required
                    >
                      <option value="" disabled>Pilih produk</option>
                      {produkList.map((p) => (
                        <option key={p.id_produk} value={p.id_produk}>
                          {p.nama_produk} — Rp {p.harga.toLocaleString("id-ID")}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Jumlah Terjual</label>
                  <input
                    type="number" min="1" value={rekapForm.jumlah_item}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Total Harga (Rp)</label>
                  <input
                    type="number" min="0" step="500" value={rekapForm.total_harga}
                    onChange={(e) => setRekapForm({ ...rekapForm, total_harga: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "qris", label: "QRIS" },
                      { value: "transfer", label: "Transfer" },
                      { value: "tunai", label: "Tunai/COD" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRekapForm({ ...rekapForm, metode_pembayaran: opt.value })}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          rekapForm.metode_pembayaran === opt.value
                            ? "bg-primary-600 text-white border-primary-600"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Catatan (opsional)</label>
                  <input
                    type="text" value={rekapForm.catatan}
                    onChange={(e) => setRekapForm({ ...rekapForm, catatan: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Lokasi, keterangan, dll."
                  />
                </div>
                {rekapError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{rekapError}</p>
                )}
                <div className="flex gap-3 justify-end pt-1">
                  <button type="button" onClick={() => setRekapTarget(null)}
                    className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={isSubmittingRekap}
                    className="px-4 py-2 text-sm rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                    {isSubmittingRekap && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Rekap Modal */}
      <AnimatePresence>
        {viewRekapMember && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setViewRekapMember(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Riwayat Rekap Jualan</h2>
                  <p className="text-xs text-slate-500">{viewRekapMember.name} · {ROLE_DISPLAY[viewRekapMember.role] ?? viewRekapMember.role}</p>
                </div>
                <button onClick={() => setViewRekapMember(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                {loadingViewRekap ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                ) : viewRekapEntries.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Belum ada rekap jualan.</div>
                ) : (
                  <div className="space-y-3">
                    {viewRekapEntries.map((entry) => {
                      const isOnline = entry.type === "online";
                      const online = entry as OnlinePesananEntry;
                      const offline = entry as RekapEntry;
                      return (
                        <div key={entry.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isOnline ? "bg-blue-100" : "bg-emerald-100"}`}>
                            {isOnline
                              ? <Wifi className="w-4 h-4 text-blue-600" />
                              : <WifiOff className="w-4 h-4 text-emerald-600" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {isOnline ? online.items : (offline.produk?.nama_produk ?? "—")}
                              </p>
                              <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isOnline ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-700"}`}>
                                {isOnline ? "ONLINE" : "OFFLINE"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span>
                                {isOnline ? `#${online.kode_unik}` : `${offline.jumlah_item} item`}
                                {" · "}Rp {Number(entry.total_harga).toLocaleString("id-ID")}
                              </span>
                              {!isOnline && offline.metode_pembayaran && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  offline.metode_pembayaran === "qris" ? "bg-purple-100 text-purple-700"
                                  : offline.metode_pembayaran === "transfer" ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {offline.metode_pembayaran.toUpperCase()}
                                </span>
                              )}
                            </p>
                            {!isOnline && offline.catatan && (
                              <p className="text-xs text-slate-400 mt-0.5 italic">"{offline.catatan}"</p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(entry.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                              {!isOnline && offline.dicatat_oleh_member?.pengguna?.nama && (
                                <> · dicatat oleh {offline.dicatat_oleh_member.pengguna.nama}</>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {!loadingViewRekap && viewRekapEntries.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-blue-500" /> Online (selesai)</span>
                    <span>{viewRekapEntries.filter((e) => e.type === "online").length} pesanan</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><WifiOff className="w-3 h-3 text-emerald-500" /> Offline</span>
                    <span>{viewRekapEntries.filter((e) => e.type === "offline").length} sesi</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-700">Total Pendapatan</span>
                    <span className="text-emerald-600">
                      Rp {viewRekapEntries.reduce((s, e) => s + Number(e.total_harga), 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Kiri */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-900 text-sm">Status Hak Akses Anda</h3>
                <p className="text-xs text-blue-700 mt-1">
                  Jabatan: <strong className="bg-blue-200 px-1 py-0.5 rounded">
                    {loadingRole ? "Memuat..." : (currentUserRole ? (ROLE_DISPLAY[currentUserRole] ?? currentUserRole) : "Tidak ada jabatan")}
                  </strong>
                </p>
                <ul className="text-xs text-blue-700 mt-2 list-disc pl-4 space-y-1">
                  <li>Undang Anggota: {canAddMember ? "✅ Diizinkan" : "❌ Ditolak"}</li>
                  <li>Atur Target: {canSetTarget ? "✅ Diizinkan" : "❌ Ditolak"}</li>
                  <li>Input Rekap Jualan: {canLogSales ? "✅ Diizinkan" : "❌ Ditolak"}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" /> Pengaturan Target
            </h3>

            {/* Mode toggle */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-4">
              {(["harian", "mingguan"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => canSetTarget && setTargetMode(mode)}
                  className={`flex-1 py-2 text-xs font-bold transition-colors ${
                    targetMode === mode
                      ? "bg-primary-600 text-white"
                      : "bg-white text-slate-500 hover:bg-slate-50"
                  } ${!canSetTarget ? "cursor-not-allowed" : ""}`}
                >
                  {mode === "harian" ? "Per Hari" : "Per Minggu"}
                </button>
              ))}
            </div>

            {/* Target setter */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
              <p className="text-[10px] text-slate-400 text-center mb-3">
                {targetMode === "harian" ? "Reset otomatis jam 00:00" : "Reset otomatis Senin jam 00:00"}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => targetMode === "harian" ? setTargetPerHari((t) => Math.max(1, t - 1)) : setTargetPerMinggu((t) => Math.max(1, t - 1))}
                  disabled={!canSetTarget || (targetMode === "harian" ? targetPerHari <= 1 : targetPerMinggu <= 1)}
                  className={`p-2 rounded-lg transition-colors ${
                    !canSetTarget || (targetMode === "harian" ? targetPerHari <= 1 : targetPerMinggu <= 1)
                      ? "text-slate-300 bg-white border border-slate-100 cursor-not-allowed"
                      : "text-primary-600 bg-primary-50 hover:bg-primary-100"
                  }`}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-slate-900">
                    {targetMode === "harian" ? targetPerHari : targetPerMinggu}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {targetMode === "harian" ? "Kali/Hari" : "Kali/Minggu"}
                  </span>
                </div>
                <button
                  onClick={() => targetMode === "harian" ? setTargetPerHari((t) => Math.min(20, t + 1)) : setTargetPerMinggu((t) => Math.min(50, t + 1))}
                  disabled={!canSetTarget || (targetMode === "harian" ? targetPerHari >= 20 : targetPerMinggu >= 50)}
                  className={`p-2 rounded-lg transition-colors ${
                    !canSetTarget || (targetMode === "harian" ? targetPerHari >= 20 : targetPerMinggu >= 50)
                      ? "text-slate-300 bg-white border border-slate-100 cursor-not-allowed"
                      : "text-primary-600 bg-primary-50 hover:bg-primary-100"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!canSetTarget && (
              <p className="text-[10px] text-red-500 text-center mb-4 font-semibold flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Akses hanya untuk Pengurus & Koor
              </p>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Anggota</span>
                <span className="font-bold text-slate-900">{members.length} Orang</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Memenuhi Target</span>
                <span className="font-bold text-emerald-600">
                  {members.filter((m) =>
                    currentUserRole && currentIdMember &&
                    canSeeRekap(currentUserRole, currentIdMember, m.role, m.id_member) &&
                    (targetMode === "harian" ? m.jualanHariIni >= targetPerHari : m.jualanMingguIni >= targetPerMinggu)
                  ).length} Orang
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Anggota */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {loadingMembers ? (
            <div className="col-span-2 flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-slate-400 text-sm">Belum ada anggota aktif.</div>
          ) : members.map((member, i) => {
            const showRekap = currentUserRole && currentIdMember
              ? canSeeRekap(currentUserRole, currentIdMember, member.role, member.id_member)
              : false;
            const activeCount = targetMode === "harian" ? member.jualanHariIni : member.jualanMingguIni;
            const activeTarget = targetMode === "harian" ? targetPerHari : targetPerMinggu;
            const isTargetMet = showRekap && activeCount >= activeTarget;
            const canManage = canManageMember(member.role);
            const isCurrentUser = member.id_pengguna === currentIdPengguna;

            return (
              <motion.div
                key={member.id_member}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-white rounded-xl border p-3 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden ${ROLE_BORDER[member.role] ?? "border-slate-200"}`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${ROLE_COLOR[member.role] ?? "bg-slate-300"}`} />

                <div className="flex justify-between items-center mb-2 pl-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{member.name}</h3>
                      <p className="text-[11px] font-medium text-primary-600 truncate">{ROLE_DISPLAY[member.role] ?? member.role}</p>
                    </div>
                  </div>

                  {canManage && !isCurrentUser && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === member.id_member ? null : member.id_member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {activeMenuId === member.id_member && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20"
                          >
                            {canEditMemberRole(member.role) && (
                              <button
                                onClick={() => { setEditRoleModal({ id_member: member.id_member, currentRole: member.role }); setNewRole(""); setActiveMenuId(null); }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <UserCog className="w-4 h-4 text-slate-400" /> Ubah Jabatan
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member.id_member)}
                              disabled={isRemoving === member.id_member}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {isRemoving === member.id_member
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                              Keluarkan
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                  {showRekap ? (
                    <>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-700">
                          {targetMode === "harian" ? "Hari Ini" : "Minggu Ini"}
                        </span>
                        <span className={`text-xs font-extrabold ${isTargetMet ? "text-emerald-600" : "text-amber-600"}`}>
                          {activeCount} / {activeTarget}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[...Array(Math.max(activeTarget, activeCount))].map((_, idx) => (
                          <div key={idx} className="flex-1">
                            <div className={`h-1.5 w-full rounded-sm ${idx < activeCount ? "bg-emerald-500" : "bg-slate-200"}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {canLogSales && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openRekapModal(member); }}
                            className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4" /> Tambah
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openViewRekap(member); }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ClipboardList className="w-4 h-4" /> Lihat Rekap
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 bg-white border border-slate-100 py-2 rounded flex justify-center items-center gap-1">
                      <Lock className="w-3 h-3" /> Rekap tidak tersedia untuk jabatan Anda
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 truncate pl-1 pb-0.5">
                  <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{member.email}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
