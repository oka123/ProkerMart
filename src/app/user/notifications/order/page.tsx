"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";

const notifications = [
  {
    id: 1,
    title: "Pesanan Tiba di Tujuan",
    description: "Nilai pesanan dan dapatkan hingga 25 koin.",
    date: "21-04-2026 18:13",
    image: "https://placehold.co/100x100?text=Order1",
    isRead: false,
    type: "order",
  },
  {
    id: 2,
    title: "Pesanan sedang diantar",
    description:
      "Siap-siap untuk terima pesananmu. Bayar tunai ke kurir sebelum membuka pesanan.",
    date: "21-04-2026 08:03",
    image: "https://placehold.co/100x100?text=Order2",
    isRead: true,
    type: "order",
  },
  {
    id: 3,
    title: "Update Pengiriman Pesanan",
    description:
      "Estimasi tiba pesanan 2604173R0S1V07 telah diperbarui dari 23-04-2026 menjadi 22-04-2026.",
    date: "21-04-2026 02:29",
    image: "https://placehold.co/100x100?text=Order3",
    isRead: true,
    type: "order",
  },
];


export default function OrderNotificationsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="lg:flex lg:gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Header */}
            <MobileHeader
              title="Notifikasi"
              cartCount={50}
              chatCount={1}
              backHref="/user/account/profile"
            />

            {/* Mobile Tabs */}
            <div className="lg:hidden flex border-b border-slate-50 bg-white">
              <Link
                href="/user/notifications/order"
                className="flex-1 py-3 text-center text-sm font-medium border-b-2 border-primary-600 text-primary-600"
              >
                Pesanan
              </Link>
              <Link
                href="/user/notifications/promotion"
                className="flex-1 py-3 text-center text-sm font-medium text-slate-500"
              >
                Promosi
              </Link>
              <Link
                href="/user/notifications/info"
                className="flex-1 py-3 text-center text-sm font-medium text-slate-500"
              >
                Info
              </Link>
            </div>

            {/* Content Card */}
            <div className="space-y-4 lg:space-y-0 lg:bg-white lg:shadow-sm lg:rounded-sm">
              {/* Desktop Header Actions */}
              <div className="hidden lg:flex justify-end p-4 border-b border-slate-50">
                <button className="text-sm text-slate-500 hover:text-primary-600 transition-colors">
                  Tandai sebagai sudah dibaca
                </button>
              </div>

              {/* Mobile Status Pesanan Header */}
              <div className="lg:hidden bg-white border-b border-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status Pesanan</span>
                  <span className="bg-secondary-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                </div>
              </div>

              {/* Notification List (Desktop & Mobile Main List) */}
              <div className="divide-y divide-slate-50 bg-white">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex gap-4 p-4 lg:p-6 transition-colors hover:bg-slate-50/50 cursor-pointer ${!notif.isRead ? "bg-orange-50/30" : "bg-white"}`}
                  >
                    {/* Thumbnail Image */}
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-100 rounded-sm border border-slate-100 shrink-0 overflow-hidden self-start">
                      <Image
                        src={notif.image}
                        alt="Thumbnail"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between lg:justify-start gap-3">
                        <h3 className="text-sm lg:text-base font-medium text-slate-900">
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <span className="lg:hidden w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs lg:text-sm text-slate-500 leading-relaxed max-w-2xl">
                        {notif.description}
                      </p>
                      <p className="text-[11px] lg:text-xs text-slate-400 mt-2">
                        {notif.date}
                      </p>
                    </div>

                    {/* Desktop Action */}
                    <div className="hidden lg:flex flex-col items-end justify-between shrink-0 min-w-37.5">
                      <button className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-sm hover:bg-white hover:border-primary-600 hover:text-primary-600 transition-all">
                        Tampilkan Rincian Pesanan
                      </button>
                      {!notif.isRead && (
                        <span className="text-[10px] text-primary-600 font-medium">
                          Belum dibaca
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
