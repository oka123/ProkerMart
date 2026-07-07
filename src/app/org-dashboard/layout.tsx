"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  Store,
  PieChart,
  PlusCircle,
  FileText,
  Users,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/logout-button";
import { SwitchRoleButton } from "@/components/switch-role-button";
import { createClient } from "@/lib/supabase/client";
import {
  OrgDashboardContext,
  type OrgDashboardData,
} from "@/lib/context/OrgDashboardContext";

export default function OrgDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [org, setOrg] = useState<OrgDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/auth/login");
        return;
      }

      try {
        // Check if user owns an organisasi directly
        const { data: orgData } = await supabase
          .from("organisasi")
          .select("id_organisasi, id_pengguna, nama_organisasi, nomor_sk, status_verifikasi")
          .eq("id_pengguna", session.user.id)
          .maybeSingle();

        let organisasi = orgData;

        // If not a direct owner, check organisasi_member
        if (!organisasi) {
          const { data: memberData } = await supabase
            .from("organisasi_member")
            .select("id_organisasi, organisasi(id_organisasi, id_pengguna, nama_organisasi, nomor_sk, status_verifikasi)")
            .eq("id_pengguna", session.user.id)
            .limit(1)
            .maybeSingle();

          if (memberData?.organisasi) {
            const o = Array.isArray(memberData.organisasi)
              ? memberData.organisasi[0]
              : memberData.organisasi;
            organisasi = o;
          }
        }

        if (!organisasi) {
          console.error("[OrgDashboard] No organisasi found for user");
          router.replace("/explore");
          return;
        }

        // Fetch toko for this organisasi
        const { data: tokoData } = await supabase
          .from("toko")
          .select("id_toko, nama_toko")
          .eq("id_organisasi", organisasi.id_organisasi)
          .maybeSingle();

        setOrg({
          id_pengguna: session.user.id,
          id_organisasi: organisasi.id_organisasi,
          nama_organisasi: organisasi.nama_organisasi,
          nomor_sk: organisasi.nomor_sk,
          status_verifikasi: organisasi.status_verifikasi,
          id_toko: tokoData?.id_toko ?? "",
          nama_toko: tokoData?.nama_toko ?? organisasi.nama_organisasi,
          email: session.user.email ?? "",
        });
      } catch (err) {
        console.error("[OrgDashboard - Layout] Error:", err);
        router.replace("/explore");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const navigation = [
    { name: "Ringkasan Organisasi", href: "/org-dashboard", icon: PieChart },
    { name: "Manajemen Toko", href: "/org-dashboard/stores", icon: Store },
    { name: "Laporan Agregat", href: "/org-dashboard/agregat", icon: FileText },
    {
      name: "Manajemen Anggota",
      href: "/org-dashboard/members",
      icon: Users,
    },
    {
      name: "Profil Organisasi",
      href: "/org-dashboard/settings",
      icon: Building2,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm text-slate-500">Memuat data organisasi...</p>
        </div>
      </div>
    );
  }

  // Compute sidebar initials and verification badge
  const initials = org
    ? org.nama_organisasi
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "??";

  const verificationLabel =
    org?.status_verifikasi === "verified"
      ? "Terverifikasi"
      : org?.status_verifikasi === "pending"
        ? "Menunggu Verifikasi"
        : "Ditolak";

  const verificationColor =
    org?.status_verifikasi === "verified"
      ? "text-emerald-400"
      : org?.status_verifikasi === "pending"
        ? "text-amber-400"
        : "text-red-400";

  const verificationDotColor =
    org?.status_verifikasi === "verified"
      ? "bg-emerald-400"
      : org?.status_verifikasi === "pending"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300  flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-8 px-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Panel Organisasi
            </p>
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {org?.nama_organisasi ?? "—"}
                </p>
                <p
                  className={`text-xs ${verificationColor} flex items-center gap-1`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${verificationDotColor}`}
                  ></span>{" "}
                  {verificationLabel}
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? "bg-primary-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
          <SwitchRoleButton
            currentRoute="/org-dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors w-full"
          />
          <LogoutButton className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full" />
        </div>
      </div>

      {/* Mobile Sidebar/Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-full max-w-xs bg-slate-900 text-slate-300 h-full shadow-2xl transition-transform animate-slide-in">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 shrink-0">
              <Logo />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
              <div className="mb-8 px-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Panel Organisasi
                </p>
                <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {org?.nama_organisasi ?? "—"}
                    </p>
                    <p
                      className={`text-xs ${verificationColor} flex items-center gap-1`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${verificationDotColor}`}
                      ></span>{" "}
                      {verificationLabel}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                          ? "bg-primary-600 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2 shrink-0">
              <SwitchRoleButton
                currentRoute="/org-dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors w-full"
              />
              <LogoutButton className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar for mobile */}
        <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 shrink-0 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-xl text-white">
              {org?.nama_organisasi ?? "Panel Organisasi"}
            </span>
          </div>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <OrgDashboardContext.Provider value={{ org }}>
            {children}
          </OrgDashboardContext.Provider>
        </main>
      </div>
    </div>
  );
}
