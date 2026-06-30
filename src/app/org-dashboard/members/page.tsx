"use client";

import { useState } from "react";
import { UserPlus, Save, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROLES = [
  "Ketua", 
  "Wakil Ketua", 
  "Sekretaris", 
  "Bendahara", 
  "Ketua Pelaksana", 
  "Divisi Acara",
  "Divisi Danus", 
  "Divisi Humas",
  "Anggota Staff"
];

const SCOPES = [
  { id: "org", name: "Pengurus Inti Organisasi" },
  { id: "p1", name: "Proker: Dies Natalis ke-30" },
  { id: "p2", name: "Proker: LKMM Dasar 2026" },
  { id: "p3", name: "Proker: Bakti Sosial Desa" },
];

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  scope: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Budi Santoso", email: "budi.santoso@kampus.ac.id", role: "Ketua", scope: "org" },
    { id: 2, name: "Siti Aminah", email: "siti.aminah@kampus.ac.id", role: "Bendahara", scope: "org" },
    { id: 3, name: "Agus Pratama", email: "agus.pratama@kampus.ac.id", role: "Ketua Pelaksana", scope: "p1" },
    { id: 4, name: "Rina Kumala", email: "rina.kumala@kampus.ac.id", role: "Divisi Danus", scope: "p2" },
    { id: 5, name: "Dewi Lestari", email: "dewi.lestari@kampus.ac.id", role: "Anggota Staff", scope: "p3" },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [filterScope, setFilterScope] = useState<"all" | "org" | "proker">("all");
  const [newMember, setNewMember] = useState<Partial<Member>>({ 
    name: "", 
    email: "",
    role: "Anggota Staff", 
    scope: "org", 
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;
    
    setMembers([{ ...newMember, id: Date.now() } as Member, ...members]);
    setNewMember({ name: "", email: "", role: "Anggota Staff", scope: "org" });
    setShowAddForm(false);
    
    // Munculkan notifikasi sukses
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const updateMember = (id: number, field: keyof Member, value: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const deleteMember = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus anggota ini?")) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const filteredMembers = members.filter((member) =>
    filterScope === "all"
      ? true
      : filterScope === "org"
      ? member.scope === "org"
      : member.scope !== "org"
  );

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
            <span className="text-sm font-semibold">Undangan anggota berhasil dikirim!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Anggota</h1>
          <p className="text-sm text-slate-500 mt-1">Undang anggota baru, beri jabatan, dan tempatkan mereka ke Proker dengan cepat.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> 
          {showAddForm ? "Batal" : "Undang Anggota"}
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
              <h2 className="text-md font-bold text-slate-800 mb-4">Form Undang Anggota Baru</h2>
              <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={newMember.name ?? ""}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all" 
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Undangan</label>
                  <input 
                    type="email" 
                    required
                    value={newMember.email ?? ""}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all" 
                    placeholder="contoh@kampus.ac.id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Jabatan</label>
                  <select 
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Penugasan (Scope)</label>
                  <select 
                    value={newMember.scope}
                    onChange={(e) => setNewMember({...newMember, scope: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white"
                  >
                    {SCOPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-4 mt-2 flex justify-end">
                  <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Kirim Undangan
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-semibold text-slate-700">Filter Anggota:</span>
        {[
          { id: "all", label: "Semua" },
          { id: "org", label: "Pengurus Organisasi" },
          { id: "proker", label: "Anggota Proker" },
        ].map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setFilterScope(filter.id as "all" | "org" | "proker")}
            className={`text-sm px-4 py-2 rounded-full border transition ${
              filterScope === filter.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
        <p className="text-sm">
          <strong>Tips:</strong> Anda bisa mengundang anggota baru ke Proker dan melihat daftar anggota Proker saja dengan menggunakan filter di atas.
        </p>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-1/4">Nama Anggota</th>
                <th className="px-6 py-4 w-1/4">Email</th>
                <th className="px-6 py-4 w-1/4">Jabatan</th>
                <th className="px-6 py-4 w-1/4">Penugasan / Proker</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Belum ada anggota yang ditambahkan untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500">{SCOPES.find((s) => s.id === member.scope)?.name ?? "Proker"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{member.email}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={member.role}
                        onChange={(e) => updateMember(member.id, 'role', e.target.value)}
                        className="border border-slate-200 bg-white hover:bg-slate-50 rounded-lg py-1.5 px-2 text-sm text-slate-700 font-medium cursor-pointer focus:ring-2 focus:ring-slate-900 outline-none w-full shadow-sm transition-all"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={member.scope}
                        onChange={(e) => updateMember(member.id, 'scope', e.target.value)}
                        className={`border rounded-lg py-1.5 px-2 text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-slate-900 outline-none w-full shadow-sm transition-all ${
                          member.scope === 'org' 
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {SCOPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => deleteMember(member.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
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