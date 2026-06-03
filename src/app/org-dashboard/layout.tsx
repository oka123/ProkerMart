"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Store,
  PieChart,
  LogOut,
  PlusCircle,
  FileText,
  Users
} from "lucide-react";
import { Logo } from "@/components/Logo";

export default function OrgDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Ringkasan Organisasi', href: '/org-dashboard', icon: PieChart },
    { name: 'Manajemen Sub-Toko', href: '/org-dashboard/stores', icon: Store },
    { name: 'Daftarkan Proker Baru', href: '/org-dashboard/new-proker', icon: PlusCircle },
    { name: 'Laporan Agregat', href: '/org-dashboard/agregat', icon: FileText },
    {name: 'Manajemen Anggota', href: '/org-dashboard/members', icon: Users },
    { name: 'Profil Organisasi', href: '/org-dashboard/settings', icon: Building2 },
  ];

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
                BM
              </div>
              <div>
                <p className="text-sm font-bold text-white">BEM FMIPA</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                  Terverifikasi
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
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

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar for mobile */}
        <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center px-4 shrink-0 md:hidden">
          <span className="font-bold text-xl text-white">Panel Organisasi</span>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
