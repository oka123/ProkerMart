"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  TrendingUp,
  Users,
  ChevronDown,
  Check,
  Search,
  UserCircle,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/logout-button";
import { SwitchRoleButton } from "@/components/switch-role-button";
import { createClient } from "@/lib/supabase/client";
import { DashboardContext, type DashboardSubToko } from "@/lib/context/DashboardContext";

interface SubTokoOption extends DashboardSubToko {}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [options, setOptions] = useState<SubTokoOption[]>([]);
  const [active, setActive] = useState<SubTokoOption | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data } = await supabase
        .from("sub_toko_member")
        .select("id_member, id_sub_toko, role, sub_toko(nama_proker, toko(organisasi(nama_organisasi)))")
        .eq("id_pengguna", session.user.id)
        .eq("status", "active");

      if (!data || data.length === 0) return;

      const parsed: SubTokoOption[] = data.map((row: any) => {
        const st = row.sub_toko;
        const toko = Array.isArray(st?.toko) ? st.toko[0] : st?.toko;
        const org = Array.isArray(toko?.organisasi) ? toko.organisasi[0] : toko?.organisasi;
        return {
          id_sub_toko: row.id_sub_toko,
          id_member: row.id_member,
          role: row.role ?? "",
          nama_proker: st?.nama_proker ?? "—",
          nama_org: org?.nama_organisasi ?? "—",
        };
      });

      setOptions(parsed);

      // Restore selection via session storage; fallback to first
      const saved = sessionStorage.getItem("dashboard_sub_toko_id");
      const found = saved ? parsed.find((o) => o.id_sub_toko === saved) : null;
      setActive(found ?? parsed[0]);
    });
  }, []);

  const handleSelect = (opt: SubTokoOption) => {
    setActive(opt);
    sessionStorage.setItem("dashboard_sub_toko_id", opt.id_sub_toko);
    setShowSwitcher(false);
    setSearchQuery("");
  };

  const initials = active?.nama_org
    ? active.nama_org.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const navigation = [
    { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pesanan Masuk", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Katalog Produk", href: "/dashboard/products", icon: Package },
    { name: "Laporan Penjualan", href: "/dashboard/reports", icon: TrendingUp },
    { name: "Tim Proker", href: "/dashboard/team", icon: Users },
    { name: "Pengaturan Sub Toko", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-6 px-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Manajemen Sub-Toko
            </p>

            {/* Current proker info */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{active?.nama_org ?? "—"}</p>
                <p className="text-xs text-slate-500 truncate">{active?.nama_proker ?? "—"}</p>
              </div>
            </div>

            {/* Proker switcher button */}
            {options.length > 1 && (
              <div className="relative mt-2">
                <button
                  onClick={() => setShowSwitcher((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg border border-primary-200 transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSwitcher ? "rotate-180" : ""}`} />
                  Ganti Proker
                </button>

                {showSwitcher && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Cari proker..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {options
                        .filter((o) =>
                          !searchQuery ||
                          o.nama_proker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.nama_org.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((opt) => (
                          <button
                            key={opt.id_sub_toko}
                            onClick={() => handleSelect(opt)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{opt.nama_org}</p>
                              <p className="text-xs text-slate-500 truncate">{opt.nama_proker}</p>
                            </div>
                            {active?.id_sub_toko === opt.id_sub_toko && (
                              <Check className="w-4 h-4 text-primary-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      {options.filter((o) =>
                        !searchQuery ||
                        o.nama_proker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        o.nama_org.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <p className="px-4 py-3 text-xs text-slate-400 text-center">Proker tidak ditemukan</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">Akun</p>
          <Link
            href="/user/account/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/user/account/profile"
                ? "bg-primary-50 text-primary-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <UserCircle className="w-5 h-5 text-slate-400" />
            Akun Saya
          </Link>
          <Link
            href="/user/notifications/order"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/user/notifications")
                ? "bg-primary-50 text-primary-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Bell className="w-5 h-5 text-slate-400" />
            Notifikasi
          </Link>
          <div className="border-t border-slate-100 my-1" />
          <SwitchRoleButton
            currentRoute="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full"
          />
          <LogoutButton className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 sm:px-6 lg:px-8 shrink-0 md:hidden">
          <span className="font-bold text-xl text-slate-900">Dashboard</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <DashboardContext.Provider value={{ active }}>
            {children}
          </DashboardContext.Provider>
        </main>
      </div>
    </div>
  );
}
