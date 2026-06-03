"use client";

import {
  ShoppingCart,
  MessageSquare,
  Ticket,
  Video,
  Wallet,
  Info,
  Bell,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";

const infoNotifications = [
  {
    id: 1,
    title: "Login dari Perangkat Baru",
    description:
      "Kami mendeteksi aktivitas login baru di akun Anda dari perangkat Windows (Chrome) pada 22-04-2026 14:20. Jika ini bukan Anda, silakan segera ubah password Anda.",
    date: "22-04-2026 14:25",
    image: "https://placehold.co/100x100?text=Security",
    isRead: false,
    type: "info",
  },
  {
    id: 2,
    title: "Update Kebijakan Privasi",
    description:
      "Kami telah memperbarui kebijakan privasi kami untuk memberikan transparansi lebih baik bagi Anda. Klik untuk membaca selengkapnya.",
    date: "20-04-2026 09:00",
    image: "https://placehold.co/100x100?text=Policy",
    isRead: true,
    type: "info",
  },
];

export default function InfoNotificationsPage() {
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
                className="flex-1 py-3 text-center text-sm font-medium text-slate-500"
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
                className="flex-1 py-3 text-center text-sm font-medium border-b-2 border-primary-600 text-primary-600"
              >
                Info
              </Link>
            </div>

            {/* Content Card */}
            <div className="lg:bg-white lg:shadow-sm lg:rounded-sm">
              {/* Desktop Header Actions */}
              <div className="hidden lg:flex justify-end p-4 border-b border-slate-50">
                <button className="text-sm text-slate-500 hover:text-primary-600 transition-colors">
                  Tandai sebagai sudah dibaca
                </button>
              </div>

              {/* Notification List (Desktop & Mobile Main List) */}
              <div className="divide-y divide-slate-50">
                {infoNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex flex-col lg:flex-row gap-4 p-4 lg:p-6 transition-colors hover:bg-slate-50/50 cursor-pointer ${!notif.isRead ? "bg-orange-50/30" : "bg-white"}`}
                  >
                    {/* Thumbnail Image */}
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                      <Info className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between lg:justify-start gap-3">
                        <h3 className="text-sm lg:text-base font-medium text-slate-900">
                          {notif.title}
                        </h3>
                      </div>
                      <p className="text-xs lg:text-sm text-slate-500 leading-relaxed">
                        {notif.description}
                      </p>
                      <p className="text-[11px] lg:text-xs text-slate-400 mt-2">
                        {notif.date}
                      </p>
                    </div>

                    {/* Desktop Action */}
                    <div className="hidden lg:flex flex-col items-end justify-start shrink-0">
                      {!notif.isRead && (
                        <span className="text-[10px] text-primary-600 font-medium">
                          Informasi Penting
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
