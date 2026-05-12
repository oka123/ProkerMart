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
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";

const promotionNotifications = [
  {
    id: 1,
    title: "Makanan yang banyak dicari...",
    description:
      "Ada banyak makanan yang lagi hits dan banyak dicari orang lho, Kak! Cek sekarang di sini 👉",
    date: "21-04-2026 19:04",
    image: "https://placehold.co/400x200?text=Promotion1",
    isRead: false,
    type: "promotion",
  },
];

export default function PromotionNotificationsPage() {
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
              cartCount={3}
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
                className="flex-1 py-3 text-center text-sm font-medium border-b-2 border-primary-600 text-primary-600"
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
            <div className="lg:bg-white lg:shadow-sm lg:rounded-sm">
              {/* Desktop Header Actions */}
              <div className="hidden lg:flex justify-end p-4 border-b border-slate-50">
                <button className="text-sm text-slate-500 hover:text-primary-600 transition-colors">
                  Tandai sebagai sudah dibaca
                </button>
              </div>

              {/* Notification List (Desktop & Mobile Main List) */}
              <div className="divide-y divide-slate-50">
                {promotionNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex flex-col gap-4 p-4 lg:p-6 transition-colors hover:bg-slate-50/50 cursor-pointer ${!notif.isRead ? "bg-orange-50/30" : "bg-white"}`}
                  >
                    <div className="flex gap-4">
                      {/* Logo Icon */}
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <h3 className="text-sm lg:text-base font-medium text-slate-900">
                          {notif.title}
                        </h3>
                        <p className="text-xs lg:text-sm text-slate-500 leading-relaxed">
                          {notif.description}
                        </p>
                      </div>
                    </div>

                    {/* Banner Image */}
                    <div className="relative w-full aspect-video lg:aspect-auto lg:h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                      <Image
                        src={notif.image}
                        alt="Promotion Banner"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] lg:text-xs text-slate-400">
                        {notif.date}
                      </p>
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
