"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Save, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";
import { inviteAndAddMember, updateMemberScopeAction } from "./actions";


const ROLES = [
  "ketua",
  "wakil_ketua",
  "sekretaris",
  "bendahara",
  "ketua_pelaksana",
];

const ROLE_LABELS: Record<string, string> = {
  ketua: "Ketua",
  wakil_ketua: "Wakil Ketua",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  ketua_pelaksana: "Ketua Pelaksana",
};

interface ScopeOption {
  id: string;
  name: string;
}

interface MemberRow {
  id_member: string;
  id_pengguna: string;
  nama: string;
  email: string;
  jabatan: string;
  id_sub_toko: string | null;
}

export default function MembersPage() {
  const { org } = useOrgDashboard();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [scopes, setScopes] = useState<ScopeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [newMember, setNewMember] = useState({
    email: "",
    jabatan: "ketua",
    id_sub_toko: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!org?.id_organisasi) { setLoading(false); return; }
    const supabase = createClient();

    try {
      let scopeOptions: ScopeOption[] = [
        { id: "", name: "Inti Organisasi" },
      ];

      // Fetch sub_toko list for scope options only if toko exists
      if (org.id_toko) {
        const { data: subTokos } = await supabase
          .from("sub_toko")
          .select("id_sub_toko, nama_proker")
          .eq("id_toko", org.id_toko);

        scopeOptions = [
          ...scopeOptions,
          ...(subTokos ?? []).map((st) => ({
            id: st.id_sub_toko,
            name: `Proker: ${st.nama_proker}`,
          })),
        ];
      }

      setScopes(scopeOptions);

      // Fetch members from organisasi_member with pengguna data
      const { data: membersData } = await supabase
        .from("organisasi_member")
        .select("id_member, id_pengguna, jabatan, id_sub_toko, pengguna(nama, email)")
        .eq("id_organisasi", org.id_organisasi);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed: MemberRow[] = (membersData ?? []).map((m: any) => {
        const pengguna = Array.isArray(m.pengguna) ? m.pengguna[0] : m.pengguna;
        return {
          id_member: m.id_member,
          id_pengguna: m.id_pengguna,
          nama: pengguna?.nama ?? "—",
          email: pengguna?.email ?? "—",
          jabatan: m.jabatan,
          id_sub_toko: m.id_sub_toko,
        };
      });

      setMembers(parsed);
    } catch (err) {
      console.error("[OrgDashboard - Members] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id_organisasi || !newMember.email) return;
    setIsSubmitting(true);

    try {
      const result = await inviteAndAddMember(
        org.id_organisasi,
        newMember.email,
        newMember.jabatan,
        newMember.id_sub_toko || null
      );

      if (!result.success) {
        alert(result.error);
        return;
      }

      showSuccessToast("Berhasil ditambahkan. Jika belum punya akun, email undangan telah dikirim.");
      setNewMember({ email: "", jabatan: "ketua", id_sub_toko: "" });
      setShowAddForm(false);
      await fetchData();
    } catch (err: unknown) {
      console.error("[OrgDashboard - Members] Add error:", err);
      alert("Gagal menambahkan anggota.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const updateMemberScope = async (id_member: string, id_sub_toko: string) => {
    const result = await updateMemberScopeAction(id_member, id_sub_toko || null);

    if (!result.success) {
      alert(result.error);
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id_member === id_member
          ? { ...m, id_sub_toko: id_sub_toko || null }
          : m
      )
    );
  };

  const updateMemberJabatan = async (id_member: string, jabatan: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("organisasi_member")
      .update({ jabatan })
      .eq("id_member", id_member);

    if (error) {
      console.error("[OrgDashboard - Members] Update jabatan error:", error);
      alert("Gagal mengubah jabatan.");
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id_member === id_member
          ? { ...m, jabatan }
          : m
      )
    );
  };

  const deleteMember = async (id_member: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus anggota ini?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("organisasi_member")
      .delete()
      .eq("id_member", id_member);

    if (error) {
      console.error("[OrgDashboard - Members] Delete error:", error);
      alert("Gagal menghapus anggota.");
      return;
    }

    showSuccessToast("Anggota berhasil dihapus.");
    setMembers((prev) => prev.filter((m) => m.id_member !== id_member));
  };

  const getScopeName = (id_sub_toko: string | null) => {
    if (!id_sub_toko) return "Inti Organisasi";
    return scopes.find((s) => s.id === id_sub_toko)?.name ?? "Proker";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm text-slate-500">Memuat data anggota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Anggota</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tambahkan anggota, beri jabatan, dan tempatkan mereka ke Proker.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {showAddForm ? "Batal" : "Tambah Anggota"}
        </button>
      </div>

      {/* Add Member Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-md font-bold text-slate-800 mb-4">
                Tambah Anggota Baru
              </h2>
              <form
                onSubmit={handleAddMember}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
              >
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Email Pengguna
                  </label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                    placeholder="contoh@kampus.ac.id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Jabatan
                  </label>
                  <select
                    value={newMember.jabatan}
                    onChange={(e) =>
                      setNewMember({ ...newMember, jabatan: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Penugasan (Scope)
                  </label>
                  <select
                    value={newMember.id_sub_toko}
                    onChange={(e) =>
                      setNewMember({ ...newMember, id_sub_toko: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white"
                  >
                    {scopes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4 mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Tambahkan
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-1/4">Nama Anggota</th>
                <th className="px-6 py-4 w-1/5">Email</th>
                <th className="px-6 py-4 w-1/5">Jabatan</th>
                <th className="px-6 py-4 w-1/5">Penugasan / Proker</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada anggota.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id_member}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                          {member.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {member.nama}
                          </div>
                          <div className="text-xs text-slate-500">
                            {getScopeName(member.id_sub_toko)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{member.email}</td>

                    <td className="px-6 py-4">
                      <select
                        value={member.jabatan}
                        onChange={(e) => updateMemberJabatan(member.id_member, e.target.value)}
                        className="border border-slate-200 rounded-lg py-1.5 px-2 text-sm text-slate-700 cursor-pointer focus:ring-2 focus:ring-slate-900 outline-none w-full bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={member.id_sub_toko ?? ""}
                        onChange={(e) =>
                          updateMemberScope(member.id_member, e.target.value)
                        }
                        className={`border rounded-lg py-1.5 px-2 text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-slate-900 outline-none w-full shadow-sm transition-all ${!member.id_sub_toko
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                      >
                        {scopes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deleteMember(member.id_member)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}