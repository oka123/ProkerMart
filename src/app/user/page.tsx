"use client";

import {
  User,
  Bell,
  Ticket,
  ChevronRight,
  CreditCard,
  ShoppingBag,
  Truck,
  ClipboardList,
  Star,
  Info,
  MapPin,
  KeyRound,
  LogOut,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";

const orderStatus = [
  { name: "Belum Bayar", icon: CreditCard, count: 0 },
  { name: "Dikemas", icon: ShoppingBag, count: 0 },
  { name: "Dikirim", icon: Truck, count: 1, badge: 1 },
  { name: "Beri Penilaian", icon: Star, count: 6, badge: 6 },
];

const menuList = [
  {
    title: "Akun Saya",
    items: [
      {
        name: "Profil Saya",
        icon: User,
        href: "/user/account/profile",
        color: "text-blue-500",
      },
      {
        name: "Alamat Saya",
        icon: MapPin,
        href: "/user/account/address",
        color: "text-red-500",
      },
      {
        name: "Ubah Password",
        icon: KeyRound,
        href: "/user/account/password",
        color: "text-orange-500",
      },
    ],
  },
  {
    title: "Notifikasi",
    items: [
      {
        name: "Status Pesanan",
        icon: Bell,
        href: "/user/notifications/order",
        color: "text-orange-500",
      },
      {
        name: "Promosi",
        icon: Ticket,
        href: "/user/notifications/promotion",
        color: "text-red-500",
      },
      {
        name: "Info",
        icon: Info,
        href: "/user/notifications/info",
        color: "text-blue-500",
      },
    ],
  },
  {
    title: "Voucher Saya",
    items: [
      {
        name: "Voucher Saya",
        icon: Ticket,
        href: "/user/voucher",
        color: "text-primary-600",
      },
    ],
  },
  // {
  //   title: "Dukungan",
  //   items: [
  //     {
  //       name: "Pusat Bantuan",
  //       icon: Headset,
  //       href: "#",
  //       color: "text-green-500",
  //     },
  //     {
  //       name: "Tentang ProkerMart",
  //       icon: Info,
  //       href: "#",
  //       color: "text-slate-400",
  //     },
  //     {
  //       name: "Kebijakan Privasi",
  //       icon: ShieldCheck,
  //       href: "#",
  //       color: "text-blue-600",
  //     },
  //   ],
  // },
];

export default function UserDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 ">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="lg:flex lg:gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block shrink-0">
            <UserSidebar />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* --- MOBILE VIEW --- */}
            <div className="lg:hidden">
              <MobileHeader title="Akun Saya" backHref="/" rightActions={[]} />
              {/* User Header */}
              <div className="bg-linear-to-br from-primary-600 to-primary-700 p-6 relative overflow-hidden">
                {/* Decorative Pattern (Optional simplified batik/grid) */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px]" />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-white/50 overflow-hidden bg-white/20">
                      <Image
                        src="https://placehold.co/200x200?text=User"
                        alt="User Avatar"
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="text-white">
                      <h2 className="text-xl font-bold">Andi123</h2>
                      {/* <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/30">
                          Silver Member
                        </span>
                        <div className="flex -space-x-1">
                          <span className="text-[10px] text-white/80">
                            0 Pengikut | 0 Mengikuti
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </div>
                  <div className="flex gap-4 text-white">
                    {/* <Settings className="w-6 h-6" /> */}
                    <Link href="/cart" className="relative">
                      <ShoppingBag className="w-6 h-6" />
                      <span className="absolute -top-1 -right-1 bg-white text-primary-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        23
                      </span>
                    </Link>
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent("openProkerChat"))}
                      className="relative"
                    >
                      <MessageSquare className="w-6 h-6" />
                      <span className="absolute -top-1 -right-1 bg-white text-primary-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        9
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Banner/Stat (Optional) */}
              {/* <div className="px-4 -mt-6 relative z-20">
                <div className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between border border-orange-100">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium">Koin ProkerMart</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-500">
                    <span className="font-bold">12.500</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div> */}

              {/* Order Status Section */}
              <div className="mt-4 px-0">
                <div className="bg-white p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary-600" />
                      Pesanan Saya
                    </h3>
                    <Link
                      href="/user/purchase"
                      className="text-xs text-slate-400 flex items-center gap-1"
                    >
                      Lihat Riwayat Pesanan <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {orderStatus.map((status) => (
                      <Link
                        key={status.name}
                        href="/user/purchase"
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="relative p-2">
                          <status.icon className="w-7 h-7 text-slate-600 stroke-[1.5]" />
                          {status.badge && (
                            <span className="absolute top-0 -right-1 bg-primary-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                              {status.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 text-center leading-tight">
                          {status.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Menu Sections */}
              <div className="mt-2 space-y-2">
                {menuList.map((section) => (
                  <div key={section.title} className="bg-white">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {section.title}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {section.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center justify-between p-4 active:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            <span className="text-sm text-slate-700">
                              {item.name}
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Logout Button Mobile */}
              <div className="mt-4 px-4 pb-8">
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-500 font-medium rounded-sm border border-red-100 shadow-sm">
                  <LogOut className="w-5 h-5" />
                  Keluar
                </button>
              </div>
            </div>

            {/* --- DESKTOP VIEW --- */}
            <div className="hidden lg:block h-full">
              <div className="bg-white rounded-sm shadow-sm p-12 flex flex-col items-center justify-center text-center h-full min-h-150">
                <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <User className="w-16 h-16 text-slate-200" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Halo, Andi123!
                </h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Selamat datang di dashboard akun Anda. Pilih menu di sebelah
                  kiri untuk mengelola profil, melihat pesanan, atau memeriksa
                  notifikasi Anda.
                </p>

                <div className="grid grid-cols-2 gap-6 mt-12 w-full max-w-3xl">
                  <div className="bg-slate-50 p-6 rounded-sm border border-slate-100">
                    <span className="text-3xl font-bold text-primary-600">
                      0
                    </span>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
                      Pesanan Berjalan
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-sm border border-slate-100">
                    <span className="text-3xl font-bold text-primary-600">
                      4
                    </span>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
                      Voucher Saya
                    </p>
                  </div>
                  {/* <div className="bg-slate-50 p-6 rounded-sm border border-slate-100">
                    <span className="text-3xl font-bold text-primary-600">
                      12.5k
                    </span>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
                      Koin ProkerMart
                    </p>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
