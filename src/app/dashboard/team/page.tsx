"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  UserCog,
  Mail,
  ShieldAlert,
  Settings2,
  Minus,
  Plus,
  ShoppingBag,
  Lock,
} from "lucide-react";

export default function TeamPage() {
  // Simulasi Role Login saat ini
  const allRoles = [
    "Ketua Proker",
    "Wakil Proker",
    "Sekretaris Proker",
    "Bendahara Proker",
    "Koor Penggalian Dana",
    "Anggota Penggalian Dana",
  ];

  const [currentUserRole, setCurrentUserRole] = useState("Ketua Proker");

  // Logika RBAC (Role-Based Access Control)
  const canAddMember = [
    "Ketua Proker",
    "Wakil Proker",
    "Sekretaris Proker",
    "Bendahara Proker",
    "Koor Penggalian Dana",
  ].includes(currentUserRole);
  const canSetTarget = [
    "Ketua Proker",
    "Wakil Proker",
    "Sekretaris Proker",
    "Bendahara Proker",
    "Koor Penggalian Dana",
  ].includes(currentUserRole);
  const canLogSales = [
    "Koor Penggalian Dana",
    "Anggota Penggalian Dana",
  ].includes(currentUserRole);

  const [targetPerMinggu, setTargetPerMinggu] = useState(3);

  const handleKurangTarget = () => {
    if (targetPerMinggu > 1) setTargetPerMinggu(targetPerMinggu - 1);
  };

  const handleTambahTarget = () => {
    if (targetPerMinggu < 7) setTargetPerMinggu(targetPerMinggu + 1);
  };

  const [team, setTeam] = useState([
    {
      id: 1,
      name: "Agung Arda Swari",
      role: "Ketua Proker",
      email: "arda@mahasiswa.unud.ac.id",
      jualanMingguIni: 3,
    },
    {
      id: 2,
      name: "Nyoman Tryasti",
      role: "Koor Penggalian Dana",
      email: "tryasti@mahasiswa.unud.ac.id",
      jualanMingguIni: 2,
    },
    {
      id: 3,
      name: "Gede Oka Adyuta",
      role: "Anggota Penggalian Dana",
      email: "oka@mahasiswa.unud.ac.id",
      jualanMingguIni: 0,
    },
    {
      id: 4,
      name: "Dewa Pradnyana",
      role: "Anggota Penggalian Dana",
      email: "dewa@mahasiswa.unud.ac.id",
      jualanMingguIni: 1,
    },
  ]);

  const handleAddSales = (id: number) => {
    setTeam(
      team.map((m) =>
        m.id === id ? { ...m, jualanMingguIni: m.jualanMingguIni + 1 } : m,
      ),
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Simulation Dropdown */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-sm">
            Simulasi Hak Akses (RBAC)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-300">Login Sebagai:</span>
          <select
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {allRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tim Kepanitiaan & Jadwal
          </h1>
          <p className="text-sm text-slate-500">
            Kelola anggota divisi sesuai dengan tingkat jabatan dan wewenang.
          </p>
        </div>
        {canAddMember ? (
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Undang Anggota
          </button>
        ) : (
          <button
            disabled
            className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 cursor-not-allowed border border-slate-200"
          >
            <Lock className="w-4 h-4" />
            Tidak Ada Akses Mengundang
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Pengaturan & Ringkasan */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-900 text-sm">
                  Status Hak Akses Anda
                </h3>
                <p className="text-xs text-blue-700 mt-1">
                  Jabatan:{" "}
                  <strong className="bg-blue-200 px-1 py-0.5 rounded">
                    {currentUserRole}
                  </strong>
                </p>
                <ul className="text-xs text-blue-700 mt-2 list-disc pl-4 space-y-1">
                  <li>
                    Undang Anggota:{" "}
                    {canAddMember ? "✅ Diizinkan" : "❌ Ditolak"}
                  </li>
                  <li>
                    Atur Target: {canSetTarget ? "✅ Diizinkan" : "❌ Ditolak"}
                  </li>
                  <li>
                    Input Jualan: {canLogSales ? "✅ Diizinkan" : "❌ Ditolak"}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" />
              Pengaturan Target Mingguan
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <p className="text-xs font-semibold text-slate-500 mb-3 text-center">
                Wajib Jualan Per Anggota
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleKurangTarget}
                  disabled={!canSetTarget || targetPerMinggu <= 1}
                  className={`p-2 rounded-lg transition-colors ${!canSetTarget || targetPerMinggu <= 1 ? "text-slate-300 bg-white border border-slate-100 cursor-not-allowed" : "text-primary-600 bg-primary-50 hover:bg-primary-100"}`}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-slate-900">
                    {targetPerMinggu}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Kali/Minggu
                  </span>
                </div>
                <button
                  onClick={handleTambahTarget}
                  disabled={!canSetTarget || targetPerMinggu >= 7}
                  className={`p-2 rounded-lg transition-colors ${!canSetTarget || targetPerMinggu >= 7 ? "text-slate-300 bg-white border border-slate-100 cursor-not-allowed" : "text-primary-600 bg-primary-50 hover:bg-primary-100"}`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {!canSetTarget && (
                <p className="text-[10px] text-red-500 text-center mt-3 font-semibold flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Akses hanya untuk Pengurus & Koor
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Anggota</span>
                <span className="font-bold text-slate-900">
                  {team.length} Orang
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Memenuhi Target</span>
                <span className="font-bold text-emerald-600">
                  {
                    team.filter((m) => m.jualanMingguIni >= targetPerMinggu)
                      .length
                  }{" "}
                  Orang
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Anggota & Tracker Jualan */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.map((member, i) => {
            const isTargetMet = member.jualanMingguIni >= targetPerMinggu;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    member.role.includes("Ketua") ||
                    member.role.includes("Wakil") ||
                    member.role.includes("Bendahara") ||
                    member.role.includes("Sekretaris")
                      ? "bg-purple-500"
                      : member.role.includes("Koor")
                        ? "bg-primary-500"
                        : "bg-slate-300"
                  }`}
                ></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-base">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {member.name}
                      </h3>
                      <p className="text-xs font-medium text-primary-600">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <UserCog className="w-4 h-4" />
                  </button>
                </div>

                {/* Tracker Jualan Dinamis */}
                <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Progress Keliling
                    </span>
                    <span
                      className={`text-xs font-extrabold ${isTargetMet ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {member.jualanMingguIni} / {targetPerMinggu}
                    </span>
                  </div>

                  <div className="flex gap-1 mb-3">
                    {[...Array(targetPerMinggu)].map((_, index) => {
                      const isCompleted = index < member.jualanMingguIni;
                      return (
                        <div key={index} className="flex-1">
                          <div
                            className={`h-2.5 w-full rounded-sm ${isCompleted ? "bg-emerald-500" : "bg-slate-200"}`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>

                  {canLogSales ? (
                    <button
                      onClick={() => handleAddSales(member.id)}
                      className="w-full py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3" /> Tambah Rekap Jualan
                    </button>
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 bg-white border border-slate-100 py-1 rounded flex justify-center items-center gap-1">
                      <Lock className="w-3 h-3" /> Hanya Pengdan yang bisa rekap
                      jualan
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3 h-3" />
                  {member.email}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
