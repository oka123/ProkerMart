"use client";

import { useEffect, useState } from "react";
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
  MessageSquare,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UserDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  const [userData, setUserData] = useState<{
    nama: string;
    email: string;
    foto_profil: string | null;
  } | null>(null);

  const [orderCounts, setOrderCounts] = useState({
    belumBayar: 0,
    dikemas: 0,
    dikirim: 0,
    selesai: 0,
    berjalan: 0,
  });

  const [voucherCount, setVoucherCount] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/auth/login");
          return;
        }

        // Fetch Profil
        const { data: pengguna } = await supabase
          .from("pengguna")
          .select("nama, email, foto_profil")
          .eq("id_pengguna", user.id)
          .single();

        if (pengguna) {
          setUserData(pengguna);
        }

        // Fetch Pesanan
        const { data: pesananData } = await supabase
          .from("pesanan")
          .select("status_pesanan")
          .eq("id_pengguna", user.id);

        if (pesananData) {
          const counts = {
            belumBayar: 0,
            dikemas: 0,
            dikirim: 0,
            selesai: 0,
            berjalan: 0,
          };

          pesananData.forEach((p) => {
            if (p.status_pesanan === "menunggu_pembayaran") {
              counts.belumBayar++;
              counts.berjalan++;
            } else if (
              p.status_pesanan === "menunggu_konfirmasi" ||
              p.status_pesanan === "diproses"
            ) {
              counts.dikemas++;
              counts.berjalan++;
            } else if (p.status_pesanan === "siap_diambil") {
              counts.dikirim++;
              counts.berjalan++;
            } else if (p.status_pesanan === "selesai") {
              counts.selesai++;
            }
          });
          setOrderCounts(counts);
        }

        // Fetch Vouchers
        const { count: vCount } = await supabase
          .from("voucher_pengguna")
          .select("*", { count: "exact", head: true })
          .eq("id_pengguna", user.id)
          .eq("status_pakai", false);

        setVoucherCount(vCount || 0);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [router, supabase]);

  const orderStatusConfig = [
    { name: "Belum Bayar", icon: CreditCard, count: orderCounts.belumBayar },
    { name: "Dikemas", icon: ShoppingBag, count: orderCounts.dikemas },
    { name: "Dikirim/Ambil", icon: Truck, count: orderCounts.dikirim },
    { name: "Beri Penilaian", icon: Star, count: orderCounts.selesai },
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
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 ">
      <div className="hidden lg:block ">
        <Navbar />
      </div>

      <main className="flex-1 w-full px-0 py-0 mx-auto max-w-7xl md:px-4 lg:px-8 md:py-6">
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
              <div className="relative p-6 overflow-hidden bg-linear-to-br from-primary-600 to-primary-700">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px]" />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 overflow-hidden border-2 rounded-full border-white/50 bg-white/20">
                      <Image
                        src={
                          userData?.foto_profil ||
                          "https://placehold.co/200x200?text=User"
                        }
                        alt="User Avatar"
                        loading="eager"
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                    <div className="text-white">
                      <h2 className="text-xl font-bold">
                        {userData?.nama || "User"}
                      </h2>
                      <p className="text-xs opacity-80">{userData?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-white">
                    <Link href="/cart" className="relative">
                      <ShoppingBag className="w-6 h-6" />
                    </Link>
                    <button
                      onClick={() =>
                        window.dispatchEvent(new CustomEvent("openProkerChat"))
                      }
                      className="relative"
                    >
                      <MessageSquare className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Status Section */}
              <div className="px-0 mt-4">
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 font-medium text-slate-900">
                      <ClipboardList className="w-5 h-5 text-primary-600" />
                      Pesanan Saya
                    </h3>
                    <Link
                      href="/user/purchase"
                      className="flex items-center gap-1 text-xs text-slate-400"
                    >
                      Lihat Riwayat Pesanan <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {orderStatusConfig.map((status) => (
                      <Link
                        key={status.name}
                        href="/user/purchase"
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="relative p-2">
                          <status.icon className="w-7 h-7 text-slate-600 stroke-[1.5]" />
                          {status.count > 0 && (
                            <span className="absolute top-0 -right-1 bg-primary-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                              {status.count}
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
                          className="flex items-center justify-between p-4 transition-colors active:bg-slate-50"
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
              <div className="px-4 pb-8 mt-4">
                <LogoutButton className="flex items-center justify-center w-full gap-2 py-3 font-medium text-red-500 bg-white border border-red-100 rounded-sm shadow-sm"></LogoutButton>
              </div>
            </div>

            {/* --- DESKTOP VIEW --- */}
            <div className="hidden h-full lg:block">
              <div className="bg-white rounded-sm shadow-sm p-12 flex flex-col items-center justify-center text-center h-full min-h-112.5">
                <div className="relative flex items-center justify-center w-32 h-32 mb-6 overflow-hidden border rounded-full bg-slate-50 border-slate-200">
                  {userData?.foto_profil ? (
                    <Image
                      src={userData.foto_profil}
                      alt="User Avatar"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="w-16 h-16 text-slate-300" />
                  )}
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  Halo, {userData?.nama || "Pengguna"}!
                </h2>
                <p className="max-w-md mx-auto text-slate-500">
                  Selamat datang di dashboard akun Anda. Pilih menu di sebelah
                  kiri untuk mengelola profil, melihat pesanan, atau memeriksa
                  notifikasi Anda.
                </p>

                <div className="grid w-full max-w-3xl grid-cols-2 gap-6 mt-12">
                  <div
                    className="p-6 transition-colors border rounded-sm cursor-pointer bg-slate-50 border-slate-100 hover:border-primary-200"
                    onClick={() => router.push("/user/purchase")}
                  >
                    <span className="text-3xl font-bold text-primary-600">
                      {orderCounts.berjalan}
                    </span>
                    <p className="mt-1 text-xs font-bold tracking-wider uppercase text-slate-500">
                      Pesanan Berjalan
                    </p>
                  </div>
                  <div
                    className="p-6 transition-colors border rounded-sm cursor-pointer bg-slate-50 border-slate-100 hover:border-primary-200"
                    onClick={() => router.push("/user/voucher")}
                  >
                    <span className="text-3xl font-bold text-primary-600">
                      {voucherCount}
                    </span>
                    <p className="mt-1 text-xs font-bold tracking-wider uppercase text-slate-500">
                      Voucher Tersedia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
