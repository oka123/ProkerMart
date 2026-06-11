"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Store, ChevronRight, Truck, Loader2 } from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  name: string;
  image: string;
  variation: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  storeName: string;
  status: string; // Internal DB status
  statusLabel: string; // UI Tab Label
  statusText: string;
  items: OrderItem[];
  totalPrice: number;
  isRated: boolean;
}

const tabs = [
  "Semua",
  "Belum Bayar",
  "Sedang Dikemas",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

const mapStatusToTab = (status: string) => {
  switch (status) {
    case "menunggu_pembayaran":
      return "Belum Bayar";
    case "menunggu_konfirmasi":
    case "diproses":
      return "Sedang Dikemas";
    case "siap_diambil":
      return "Dikirim";
    case "selesai":
      return "Selesai";
    case "dibatalkan":
      return "Dibatalkan";
    default:
      return "Semua";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "menunggu_pembayaran":
      return "Pesanan menunggu pembayaran dilakukan.";
    case "menunggu_konfirmasi":
      return "Pembayaran sedang diverifikasi oleh penjual.";
    case "diproses":
      return "Pesanan sedang disiapkan oleh penjual.";
    case "siap_diambil":
      return "Pesanan siap untuk diambil atau sedang diantar.";
    case "selesai":
      return "Pesanan telah selesai.";
    case "dibatalkan":
      return "Pesanan ini telah dibatalkan.";
    default:
      return "";
  }
};

export default function PurchasePage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("Semua");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data: pesananList, error } = await supabase
          .from("pesanan")
          .select(
            `
            id_pesanan,
            kode_unik,
            total_harga,
            status_pesanan,
            sub_toko (
              nama_proker
            ),
            detail_pesanan (
              id_detail,
              jumlah,
              harga_satuan,
              produk (
                nama_produk,
                foto,
                kategori
              )
            )
          `,
          )
          .eq("id_pengguna", user.id)
          .order("tgl_pesan", { ascending: false });

        if (error) throw error;

        if (pesananList) {
          const formattedOrders: Order[] = pesananList.map((p: any) => ({
            id: p.kode_unik,
            storeName: p.sub_toko?.nama_proker || "Toko Tidak Diketahui",
            status: p.status_pesanan,
            statusLabel: mapStatusToTab(p.status_pesanan),
            statusText: getStatusText(p.status_pesanan),
            totalPrice: p.total_harga,
            isRated: false, // Feature not implemented in DB
            items:
              p.detail_pesanan?.map((dp: any) => ({
                id: dp.id_detail,
                name: dp.produk?.nama_produk || "Produk Dihapus",
                image:
                  dp.produk?.foto ||
                  "https://placehold.co/100x100?text=No+Image",
                variation: dp.produk?.kategori || "Umum",
                quantity: dp.jumlah,
                price: dp.harga_satuan,
              })) || [],
          }));

          setOrders(formattedOrders);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [router, supabase]);

  const filteredOrders =
    activeTab === "Semua"
      ? orders
      : orders.filter((o) => o.statusLabel === activeTab);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("Rp", "Rp ");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 ">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          <div className="flex-1 min-w-0 space-y-4">
            <MobileHeader
              title="Pesanan Saya"
              backHref="/user"
              rightActions={["search", "chat"]}
              chatCount={0}
            />

            <div className="bg-white md:rounded-sm shadow-sm sticky top-14 lg:top-0 z-30 w-full">
              <div className="flex overflow-x-auto scroll-smooth">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-5 md:px-8 py-3 md:py-4 text-sm font-medium transition-all relative min-w-fit text-center whitespace-nowrap cursor-pointer ${
                      activeTab === tab
                        ? "text-primary-600"
                        : "text-slate-600 hover:text-primary-600"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Kamu bisa cari berdasarkan Nama Penjual, No. Pesanan atau Nama Produk"
                  className="w-full px-12 py-3 bg-slate-200 border-none rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-white md:rounded-sm shadow-sm p-12 text-center text-slate-500">
                  <Store className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Belum ada pesanan.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white md:rounded-sm shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-slate-50 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex items-center gap-2 group cursor-pointer min-w-0">
                          <Store className="w-4 h-4 text-slate-700 shrink-0" />
                          <span className="font-bold text-sm group-hover:text-primary-600 truncate">
                            {order.storeName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Truck className="hidden sm:block w-4 h-4 text-emerald-500" />
                        <span className="text-[11px] sm:text-xs md:text-sm text-emerald-600 sm:pr-4 sm:border-r border-slate-100 whitespace-nowrap uppercase">
                          {order.statusLabel}
                        </span>
                        <span className="hidden sm:block text-primary-600 text-sm font-bold whitespace-nowrap uppercase">
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-20 h-20 bg-slate-100 rounded-sm relative border border-slate-100 shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-sm line-clamp-2 md:line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Kategori: {item.variation}
                            </p>
                            <p className="text-xs font-medium">
                              x{item.quantity}
                            </p>
                          </div>
                          <div className="text-right flex flex-col justify-end">
                            <span className="text-sm text-primary-600">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                          {(order.statusLabel === "Dikirim" ||
                            order.statusLabel === "Sedang Dikemas") && (
                            <Truck className="w-4 h-4 shrink-0 text-emerald-500" />
                          )}
                          <p
                            className={`truncate sm:line-clamp-2 ${order.statusLabel === "Dikirim" || order.statusLabel === "Selesai" ? "text-emerald-600" : ""}`}
                          >
                            {order.statusText}
                          </p>
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <span className="text-xs sm:text-sm text-slate-600">
                            Total Pesanan:
                          </span>
                          <span className="text-lg sm:text-xl font-bold text-primary-600">
                            {formatPrice(order.totalPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 mt-6">
                        {order.statusLabel === "Selesai" ? (
                          <>
                            <button className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-sm shadow-md hover:bg-primary-700 transition-all whitespace-nowrap">
                              Beli Lagi
                            </button>
                            <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium rounded-sm hover:bg-slate-50 whitespace-nowrap">
                              Penilaian
                            </button>
                          </>
                        ) : order.statusLabel === "Belum Bayar" ? (
                          <>
                            <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium rounded-sm hover:bg-slate-50 whitespace-nowrap">
                              Batalkan Pesanan
                            </button>
                            <button className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-sm shadow-md hover:bg-primary-700 whitespace-nowrap">
                              Bayar Sekarang
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium rounded-sm hover:bg-slate-50 whitespace-nowrap">
                              Hubungi Penjual
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
