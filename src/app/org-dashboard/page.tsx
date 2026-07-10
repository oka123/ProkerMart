"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  TrendingUp,
  Users,
  ChevronRight,
  Plus,
  CheckCircle2,
  Building2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";
import { ProkerModal } from "@/components/org/proker-modal";

interface SubTokoRow {
  id_sub_toko: string;
  nama_proker: string;
  status: string;
  totalOrders: number;
  totalRevenue: number;
}

interface OrgStats {
  totalRevenue: number;
  totalSubToko: number;
  activeSubToko: number;
  totalMembers: number;
  totalOrders: number;
}

export default function OrgDashboardPage() {
  const { org } = useOrgDashboard();
  const [subTokos, setSubTokos] = useState<SubTokoRow[]>([]);
  const [stats, setStats] = useState<OrgStats>({
    totalRevenue: 0,
    totalSubToko: 0,
    activeSubToko: 0,
    totalMembers: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  const fetchData = useCallback(async () => {
    if (!org?.id_toko) { setLoading(false); return; }

    const supabase = createClient();

    try {
      // 1. Fetch all sub_toko for this toko
      const { data: subTokoData } = await supabase
        .from("sub_toko")
        .select("id_sub_toko, nama_proker, status")
        .eq("id_toko", org.id_toko);

      const subTokos = subTokoData ?? [];

      // 2. Fetch orders aggregate per sub_toko
      const subTokoIds = subTokos.map((st) => st.id_sub_toko);

      let ordersMap: Record<string, { count: number; revenue: number }> = {};
      if (subTokoIds.length > 0) {
        const { data: ordersData } = await supabase
          .from("pesanan")
          .select("id_sub_toko, total_harga")
          .in("id_sub_toko", subTokoIds);

        if (ordersData) {
          for (const o of ordersData) {
            if (!ordersMap[o.id_sub_toko]) {
              ordersMap[o.id_sub_toko] = { count: 0, revenue: 0 };
            }
            ordersMap[o.id_sub_toko].count += 1;
            ordersMap[o.id_sub_toko].revenue += Number(o.total_harga) || 0;
          }
        }
      }

      const parsedSubTokos: SubTokoRow[] = subTokos.map((st) => ({
        id_sub_toko: st.id_sub_toko,
        nama_proker: st.nama_proker,
        status: st.status ?? "active",
        totalOrders: ordersMap[st.id_sub_toko]?.count ?? 0,
        totalRevenue: ordersMap[st.id_sub_toko]?.revenue ?? 0,
      }));

      setSubTokos(parsedSubTokos);

      // 3. Aggregate stats
      const totalRevenue = Object.values(ordersMap).reduce(
        (sum, v) => sum + v.revenue,
        0
      );
      const totalOrders = Object.values(ordersMap).reduce(
        (sum, v) => sum + v.count,
        0
      );
      const activeSubToko = subTokos.filter(
        (s) => s.status === "active"
      ).length;

      // 4. Fetch total members count
      let totalMembers = 0;
      if (subTokoIds.length > 0) {
        const { count } = await supabase
          .from("sub_toko_member")
          .select("id_member", { count: "exact", head: true })
          .in("id_sub_toko", subTokoIds);
        totalMembers = count ?? 0;
      }

      // Also count org-level members
      const { count: orgMemberCount } = await supabase
        .from("organisasi_member")
        .select("id_member", { count: "exact", head: true })
        .eq("id_organisasi", org.id_organisasi);

      totalMembers += orgMemberCount ?? 0;

      setStats({
        totalRevenue,
        totalSubToko: subTokos.length,
        activeSubToko,
        totalMembers,
        totalOrders,
      });
    } catch (err) {
      console.error("[OrgDashboard - Ringkasan] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [org?.id_toko, org?.id_organisasi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    {
      name: "Total Pendapatan Organisasi",
      value: formatRupiah(stats.totalRevenue),
      icon: TrendingUp,
    },
    {
      name: "Total Sub-Toko (Proker)",
      value: `${stats.activeSubToko} Aktif`,
      change: `${stats.totalSubToko} Total`,
      icon: Store,
    },
    {
      name: "Total Anggota Kepanitiaan",
      value: `${stats.totalMembers} Orang`,
      icon: Users,
    },
    {
      name: "Total Pesanan Seluruh Proker",
      value: `${stats.totalOrders}`,
      icon: Building2,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Aktif",
          color: "bg-emerald-100 text-emerald-700",
        };
      case "inactive":
        return {
          label: "Nonaktif",
          color: "bg-slate-100 text-slate-700",
        };
      case "suspended":
        return {
          label: "Ditangguhkan",
          color: "bg-amber-100 text-amber-700",
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 text-slate-700",
        };
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse"
            >
              <div className="h-10 w-10 bg-slate-200 rounded-full mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">
              {successMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Selamat datang, {org?.nama_organisasi ?? "Organisasi"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ini adalah ringkasan performa seluruh program kerja Organisasi Anda
            (Rekap Toko Organisasi).
          </p>
        </div>
      </div>

      {/* Aggregate Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                {stat.change && (
                  <div className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-50 text-slate-500">
                    {stat.change}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sub-Toko Performance List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Performa Toko (Proker)
            </h2>
            <Link
              href="/org-dashboard/agregat"
              className="text-sm text-primary-600 font-medium hover:text-primary-700"
            >
              Lihat Laporan Lengkap
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Nama Proker</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Pesanan</th>
                  <th className="px-6 py-4">Omzet Total</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subTokos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <Store className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">Belum ada proker terdaftar</p>
                      <p className="text-xs mt-1">
                        Daftarkan proker pertama Anda untuk mulai berjualan
                      </p>
                    </td>
                  </tr>
                ) : (
                  subTokos.map((store) => {
                    const badge = getStatusBadge(store.status);
                    return (
                      <tr
                        key={store.id_sub_toko}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {store.nama_proker}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {store.totalOrders} Pesanan
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          {formatRupiah(store.totalRevenue)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/org-dashboard/stores"
                            className="inline-flex text-slate-400 group-hover:text-primary-600 transition-colors p-1 rounded-md hover:bg-primary-50"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Aksi Cepat</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            <Link
              href="/org-dashboard/stores"
              className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-primary-50 hover:border-primary-200 transition-colors group text-left w-full"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-slate-600 group-hover:text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Kelola Sub-Toko (Proker)
                </h3>
                <p className="text-xs text-slate-500">
                  Manajemen dan daftarkan proker baru
                </p>
              </div>
            </Link>

            <Link
              href="/org-dashboard/members"
              className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-primary-50 hover:border-primary-200 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-slate-600 group-hover:text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Kelola Anggota
                </h3>
                <p className="text-xs text-slate-500">
                  Undang dan atur jabatan anggota organisasi
                </p>
              </div>
            </Link>

            <Link
              href="/org-dashboard/agregat"
              className="mt-auto w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center block"
            >
              Lihat Laporan Lengkap
            </Link>
          </div>
        </div>
      </div>

      <ProkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="add"
        orgId={org?.id_organisasi || ""}
        tokoId={org?.id_toko || ""}
        penggunaId={org?.id_pengguna || ""}
        onSuccess={(msg) => {
          showSuccessToast(msg);
          fetchData();
        }}
      />
    </div>
  );
}