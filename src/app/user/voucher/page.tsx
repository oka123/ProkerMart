"use client";

import { useState } from "react";
import { Ticket, Search, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";

const vouchers = [
  {
    id: 1,
    title: "Diskon 10% s.d. Rp50RB",
    minSpend: "Min. Blj Rp50RB",
    expiry: "Berlaku dalam: 28 menit",
    category: "SEMUA KATEGORI",
    brand: "PROMO XTRA",
    badge: "Baru",
    type: "test",
    color: "bg-blue-600",
  },
  {
    id: 2,
    title: "Diskon s.d. 15% hingga Rp1JT",
    minSpend: "Min. Blj Rp200RB",
    expiry: "Berlaku dalam: 28 menit",
    category: "KATEGORI PILIHAN",
    brand: "PROMO XTRA+",
    badge: "Baru",
    type: "test",
    color: "bg-blue-600",
  },
  {
    id: 3,
    title: "Diskon 33% s.d. Rp50RB",
    minSpend: "Min. pembelian 3 produk",
    expiry: "Berlaku dalam: 28 menit",
    category: "FASHION",
    brand: "PROMO XTRA",
    badge: "Pemakaian Terbatas",
    promoText: "Beli 2 Gratis 1",
    type: "test",
    color: "bg-blue-600",
  },
  {
    id: 4,
    title: "Diskon 30% s.d. Rp50RB",
    minSpend: "Min. Blj Rp85RB",
    expiry: "Berlaku dalam: 28 menit",
    category: "KATEGORI PILIHAN",
    brand: "VIDEO XTRA",
    promoText: "Video XTRA",
    type: "test",
    color: "bg-blue-600",
  },
];

export default function VoucherPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 pb-20 lg:pb-0">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="lg:flex lg:gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Header */}
            <MobileHeader
              title="Voucher Saya"
              backHref="/user/account/profile"
              rightActions={[]}
            />

            {/* Content Container */}
            <div className="space-y-4">
              {/* Add Voucher Section (Desktop & Mobile) */}
              <div className="bg-white p-4 lg:p-8 lg:rounded-sm lg:shadow-sm">
                {/* Desktop Style */}
                <div className="hidden lg:flex items-center justify-center gap-4  w-full">
                  <span className="text-base font-medium whitespace-nowrap">
                    Tambah Voucher
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan kode voucher"
                    className="flex-1 border border-slate-200 rounded-sm px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  />
                  <button className="bg-slate-200 text-slate-400 px-8 py-2 rounded-sm font-medium cursor-not-allowed">
                    Simpan
                  </button>
                </div>

                {/* Mobile Style */}
                <div className="lg:hidden flex gap-4">
                  <button className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-100 rounded-sm bg-slate-50">
                    <Ticket className="w-4 h-4 text-primary-600" />
                    <span className="text-xs">Masukkan Kode Voucher</span>
                  </button>
                  <button className=" flex items-center justify-center gap-2 p-3 border border-slate-100 rounded-sm bg-slate-50">
                    <Search className="w-4 h-4 text-primary-600" />
                  </button>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="bg-white lg:rounded-sm lg:shadow-sm overflow-hidden">
                {/* Voucher Grid */}
                <div className="p-4 lg:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="flex border border-slate-100 rounded-sm shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden h-30 lg:h-35"
                      >
                        {/* Left Side (Colored) */}
                        <div
                          className={`${voucher.color} w-24 lg:w-32 flex flex-col items-center justify-center text-white shrink-0 relative overflow-hidden`}
                        >
                          {/* Dashed line effect */}
                          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-1">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 h-1 bg-[#f5f5f5] rounded-full -ml-0.5"
                              ></div>
                            ))}
                          </div>

                          <div className="z-10 flex flex-col items-center text-center px-1">
                            <div className="w-10 h-10 bg-white/20 rounded-sm flex items-center justify-center mb-1">
                              <Ticket className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[8px] lg:text-[10px] font-bold leading-tight uppercase">
                              {voucher.brand}
                            </span>
                            <span className="text-[7px] lg:text-[8px] mt-1 opacity-90 leading-tight">
                              {voucher.category}
                            </span>
                          </div>

                          {/* Top-left label if any */}
                          {voucher.badge === "Pemakaian Terbatas" && (
                            <div className="absolute top-0 left-0 bg-yellow-400 text-[#8b4513] text-[8px] font-bold px-1.5 py-0.5 rounded-br-sm z-20">
                              Pemakaian Terbatas
                            </div>
                          )}
                        </div>

                        {/* Right Side (Details) */}
                        <div className="flex-1 bg-white p-3 lg:p-4 flex flex-col justify-between relative">
                          <div className="space-y-1">
                            <h3 className="text-sm lg:text-base font-medium text-slate-800 line-clamp-1">
                              {voucher.title}
                            </h3>
                            <p className="text-[11px] lg:text-xs text-slate-500">
                              {voucher.minSpend}
                            </p>
                            {voucher.promoText && (
                              <p className="text-[10px] text-primary-600 border border-primary-600/30 bg-primary-50 px-1 rounded-sm w-fit">
                                {voucher.promoText}
                              </p>
                            )}
                          </div>

                          <div className="flex items-end justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[10px] lg:text-[11px] text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{voucher.expiry}</span>
                                <span className="text-primary-600 ml-1 cursor-pointer">
                                  S&K
                                </span>
                              </div>
                            </div>
                            <button className="border border-primary-600 text-primary-600 text-[10px] lg:text-xs font-medium px-3 py-1 rounded-sm hover:bg-primary-50 transition-colors">
                              Pakai Nanti
                            </button>
                          </div>

                          {/* "Baru" Badge */}
                          {voucher.badge === "Baru" && (
                            <div className="absolute top-0 right-0 w-8 h-8 lg:w-10 lg:h-10 overflow-hidden pointer-events-none">
                              <div className="absolute top-2 -right-2 bg-blue-600 text-white text-[8px] lg:text-[10px] font-bold py-0.5 px-6 rotate-45 translate-x-2 translate-y-0 shadow-sm uppercase">
                                Baru
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Empty State (if no vouchers) */}
              {vouchers.length === 0 && (
                <div className="bg-white lg:rounded-sm lg:shadow-sm py-20 flex flex-col items-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Ticket className="w-12 h-12 text-slate-200" />
                  </div>
                  <p className="text-slate-400">
                    Belum ada voucher yang tersedia
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
