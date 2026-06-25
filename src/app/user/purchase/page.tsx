/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Store, Truck, Loader2, Star, X } from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface OrderItem {
  id_produk: string;
  id: string;
  name: string;
  image: string;
  variation: string;
  quantity: number;
  price: number;
  metode_pengambilan?: string;
  subToko?: {
    id_sub_toko: string;
    nama_proker: string;
    id_toko: string;
  } | null;
}

interface Order {
  id_pesanan: string;
  tokoId: string;
  id: string;
  storeName: string;
  storeId: string;
  status: string; // Internal DB status
  statusLabel: string; // UI Tab Label
  statusText: string;
  items: OrderItem[];
  totalPrice: number;
  isRated: boolean;
  ratingDetail?: {
    rating: number;
    komentar: string | null;
  } | null;
  snap_token?: string | null;
}

const tabs = [
  "Semua",
  "Belum Bayar",
  "Sedang Dikemas",
  "Dikirim/Siap Diambil",
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
    case "dikirim":
      return "Dikirim/Siap Diambil";
    case "selesai":
      return "Selesai";
    case "dibatalkan":
    case "kadaluarsa":
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
      return "Pesanan siap untuk diambil.";
    case "dikirim":
      return "Pesanan sedang dikirim.";
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

  // Rating Modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isReadOnlyRating, setIsReadOnlyRating] = useState(false);

  const fetchOrders = useCallback(async () => {
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
          id_sub_toko,
          kode_unik,
          total_harga,
          status_pesanan,
          snap_token,
          sub_toko (
            id_toko,
            nama_proker
          ),
          ulasan (
            id_ulasan,
            rating,
            komentar
          ),
          detail_pesanan (
            id_detail,
            id_produk,
            jumlah,
            harga_satuan,
            metode_pengambilan,
            produk (
              nama_produk,
              foto,
              kategori,
              sub_toko (
                id_sub_toko,
                nama_proker,
                id_toko
              )
            )
          )
        `,
        )
        .eq("id_pengguna", user.id)
        .order("tgl_pesan", { ascending: false });

      if (error) throw error;

      if (pesananList) {
        const formattedOrders: Order[] = pesananList.map((p: any) => {
          const items =
            p.detail_pesanan?.map((dp: any) => ({
              id: dp.id_detail,
              id_produk: dp.id_produk,
              name: dp.produk?.nama_produk || "Produk Dihapus",
              image:
                dp.produk?.foto || "https://placehold.co/100x100?text=No+Image",
              variation: dp.produk?.kategori || "Umum",
              quantity: dp.jumlah,
              price: dp.harga_satuan,
              metode_pengambilan: dp.metode_pengambilan || "pickup",
              subToko: dp.produk?.sub_toko || {
                id_sub_toko: p.id_sub_toko,
                nama_proker: p.sub_toko?.nama_proker || "Toko Tidak Diketahui",
                id_toko: p.sub_toko?.id_toko,
              },
            })) || [];

          const hasDelivery = items.some((item: any) => item.metode_pengambilan === "delivery");
          const hasPickup = items.some((item: any) => item.metode_pengambilan === "pickup");
          const isHybrid = hasDelivery && hasPickup;

          let statusText = getStatusText(p.status_pesanan);
          if (isHybrid && (p.status_pesanan === "siap_diambil" || p.status_pesanan === "dikirim")) {
            statusText = "Pesanan sedang dikirim / siap diambil.";
          }

          return {
            id_pesanan: p.id_pesanan,
            id: p.kode_unik,
            storeId: p.id_sub_toko,
            tokoId: p.sub_toko?.id_toko,
            storeName: p.sub_toko?.nama_proker || "Toko Tidak Diketahui",
            status: p.status_pesanan,
            statusLabel: mapStatusToTab(p.status_pesanan),
            statusText: statusText,
            totalPrice: p.total_harga,
            snap_token: p.snap_token,
            isRated: p.ulasan && p.ulasan.length > 0,
            ratingDetail:
              p.ulasan && p.ulasan.length > 0
                ? {
                    rating: p.ulasan[0].rating,
                    komentar: p.ulasan[0].komentar,
                  }
                : null,
            items: items,
          };
        });

        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchOrders();
    });
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId: string, kodeUnik: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_unik: kodeUnik }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membatalkan pesanan.");
      alert("Pesanan berhasil dibatalkan.");
      await fetchOrders();
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      alert(err.message || "Gagal membatalkan pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (
      !confirm(
        "Apakah Anda yakin sudah menerima pesanan ini dan ingin menyelesaikannya?",
      )
    )
      return;
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("pesanan")
        .update({ status_pesanan: "selesai" })
        .eq("id_pesanan", orderId);

      if (error) throw error;
      alert("Pesanan berhasil diselesaikan.");
      await fetchOrders();
    } catch (err) {
      console.error("Error completing order:", err);
      alert("Gagal menyelesaikan pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };
  const handlePayNow = (token?: string | null) => {
    if (!token) {
      alert("Token pembayaran tidak ditemukan. Silakan hubungi admin.");
      return;
    }
    if ((window as any).snap) {
      (window as any).snap.pay(token, {
        onSuccess: function () {
          alert("Pembayaran berhasil!");
          fetchOrders();
        },
        onPending: function () {
          alert("Menunggu pembayaran Anda!");
          fetchOrders();
        },
        onError: function () {
          alert("Pembayaran gagal!");
        },
        onClose: function () {
          console.log("Pop-up pembayaran ditutup.");
        },
      });
    } else {
      alert("Sistem pembayaran belum siap. Silakan refresh halaman.");
    }
  };

  const handleOpenRatingModal = (order: Order, readOnly: boolean = false) => {
    setRatingOrder(order);
    if (readOnly && order.ratingDetail) {
      setRatingValue(order.ratingDetail.rating);
      setRatingComment(order.ratingDetail.komentar || "");
      setIsReadOnlyRating(true);
    } else {
      setRatingValue(5);
      setRatingComment("");
      setIsReadOnlyRating(false);
    }
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingOrder) return;
    try {
      setIsSubmittingRating(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Sesi Anda telah habis. Silakan login kembali.");
        return;
      }

      const { error } = await supabase.from("ulasan").insert({
        id_pengguna: user.id,
        id_sub_toko: ratingOrder.storeId,
        id_pesanan: ratingOrder.id_pesanan,
        rating: ratingValue,
        komentar: ratingComment || null,
      });

      if (error) throw error;

      alert("Terima kasih atas penilaian Anda!");
      setShowRatingModal(false);
      setRatingOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Gagal menyimpan ulasan. Silakan coba lagi.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleBuyAgain = async (
    items: Array<{ id_produk: string; quantity: number }>,
  ) => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Sesi Anda telah habis. Silakan login kembali.");
        return;
      }

      for (const item of items) {
        const { data: existingCartItem, error: fetchError } = await supabase
          .from("keranjang")
          .select("id_keranjang, jumlah")
          .eq("id_pengguna", user.id)
          .eq("id_produk", item.id_produk)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingCartItem) {
          const { error: updateError } = await supabase
            .from("keranjang")
            .update({ jumlah: existingCartItem.jumlah + item.quantity })
            .eq("id_keranjang", existingCartItem.id_keranjang);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("keranjang")
            .insert({
              id_pengguna: user.id,
              id_produk: item.id_produk,
              jumlah: item.quantity,
            });

          if (insertError) throw insertError;
        }
      }

      router.push("/cart");
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Gagal menambahkan produk ke keranjang. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = (storeId: string, storeName: string) => {
    const event = new CustomEvent("openProkerChat", {
      detail: {
        id_sub_toko: storeId,
        name: storeName,
        type: "toko",
        avatar: `https://placehold.co/100x100?text=${encodeURIComponent(storeName.charAt(0))}`,
      },
    });
    window.dispatchEvent(event);
  };

  const getBaseOrderId = (kode_unik: string) => {
    const lastHyphenIndex = kode_unik.lastIndexOf("-");
    if (lastHyphenIndex !== -1) {
      const suffix = kode_unik.substring(lastHyphenIndex + 1);
      if (!isNaN(Number(suffix))) {
        return kode_unik.substring(0, lastHyphenIndex);
      }
    }
    return kode_unik;
  };

  const processedOrders = useMemo(() => {
    const unpaidGroups: Record<string, Order> = {};
    const result: Order[] = [];

    orders.forEach((order) => {
      if (order.status === "menunggu_pembayaran") {
        const baseId = getBaseOrderId(order.id);
        if (!unpaidGroups[baseId]) {
          unpaidGroups[baseId] = {
            ...order,
            id: baseId,
            items: [...order.items],
          };
        } else {
          unpaidGroups[baseId].items.push(...order.items);
          unpaidGroups[baseId].totalPrice += order.totalPrice;
        }
      } else {
        result.push(order);
      }
    });

    Object.values(unpaidGroups).forEach((group) => {
      result.push(group);
    });

    return result.sort((a, b) => b.id.localeCompare(a.id));
  }, [orders]);

  const filteredOrders =
    activeTab === "Semua"
      ? processedOrders
      : processedOrders.filter((o) => o.statusLabel === activeTab);

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
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 w-full px-0 py-0 mx-auto max-w-7xl md:px-4 lg:px-8 md:py-6">
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

            <div className="sticky z-30 w-full bg-white shadow-sm md:rounded-sm top-14 lg:top-0">
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
                  className="w-full px-12 py-3 text-sm transition-all border-none rounded-sm bg-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-600"
                />
                <Search className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-white shadow-sm md:rounded-sm text-slate-500">
                  <Store className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Belum ada pesanan.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const uniqueStores = Array.from(
                    new Set(
                      order.items
                        .map((i) => i.subToko?.id_sub_toko)
                        .filter(Boolean),
                    ),
                  );
                  const isMultiStore = uniqueStores.length > 1;

                  // Get first store details
                  const firstItemStoreName =
                    order.items[0]?.subToko?.nama_proker || order.storeName;
                  const firstItemTokoId =
                    order.items[0]?.subToko?.id_toko || order.tokoId;
                  const firstItemStoreId =
                    order.items[0]?.subToko?.id_sub_toko || order.storeId;

                  return (
                    <div
                      key={order.id}
                      className="overflow-hidden transition-shadow bg-white shadow-sm md:rounded-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-50">
                        <div className="flex items-center min-w-0 gap-2">
                          <div
                            className="flex items-center min-w-0 gap-2 cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMultiStore) {
                                router.push(`/user/purchase/${order.id}`);
                              } else {
                                router.push(
                                  `/organizations/${firstItemTokoId}/${firstItemStoreId}`,
                                );
                              }
                            }}
                          >
                            <Store className="w-4 h-4 text-slate-700 shrink-0" />
                            <span className="text-sm font-bold truncate group-hover:text-primary-600">
                              {isMultiStore
                                ? `${firstItemStoreName} + ${uniqueStores.length - 1} Toko Lain`
                                : firstItemStoreName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* <Truck className="hidden w-4 h-4 sm:block text-emerald-500" /> */}
                          {/* <span className="text-[11px] sm:text-xs md:text-sm text-emerald-600 sm:pr-4 sm:border-r border-slate-100 whitespace-nowrap uppercase">
                            {order.statusLabel}
                          </span> */}
                          <span className="text-xs sm:text-sm font-bold uppercase text-primary-600 whitespace-nowrap">
                            {(() => {
                              const hasDelivery = order.items.some((i: any) => i.metode_pengambilan === "delivery");
                              const hasPickup = order.items.some((i: any) => i.metode_pengambilan === "pickup");
                              if (hasDelivery && hasPickup && (order.status === "siap_diambil" || order.status === "dikirim")) {
                                return "Dikirim / Siap Diambil";
                              }
                              return order.status.replace("_", " ");
                            })()}
                          </span>
                        </div>
                      </div>

                      <div
                        className="p-4 space-y-4 cursor-pointer"
                        onClick={() =>
                          router.push(`/user/purchase/${order.id}`)
                        }
                      >
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            <div
                              className="relative w-20 h-20 border rounded-sm cursor-pointer bg-slate-100 border-slate-100 shrink-0"
                              // onClick={(e) => {
                              //   e.stopPropagation();
                              //   router.push(`/explore/${item.id_produk}`);
                              // }}
                            >
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
                            <div className="flex flex-col justify-end text-right">
                              <span className="text-sm text-primary-600">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div className="flex items-center min-w-0 gap-2 text-xs text-slate-500">
                            {order.statusLabel === "Dikirim/Siap Diambil" && (
                              <Truck className="w-4 h-4 shrink-0 text-emerald-500" />
                            )}
                            <p
                              className={`truncate sm:line-clamp-2 ${order.statusLabel === "Dikirim/Siap Diambil" || order.statusLabel === "Selesai" ? "text-emerald-600" : ""}`}
                            >
                              {order.statusText}
                            </p>
                          </div>
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            <span className="text-xs sm:text-sm text-slate-600">
                              Total Pesanan:
                            </span>
                            <span className="text-lg font-bold sm:text-xl text-primary-600">
                              {formatPrice(order.totalPrice)}
                            </span>
                          </div>
                        </div>

                        <div
                          className="flex flex-wrap items-center justify-end gap-2 mt-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.statusLabel === "Selesai" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleBuyAgain(
                                    order.items.map((item) => ({
                                      id_produk: item.id_produk,
                                      quantity: item.quantity,
                                    })),
                                  )
                                }
                                className="flex-1 px-4 py-2 text-xs font-medium text-white transition-all rounded-sm shadow-md sm:flex-none bg-primary-600 sm:text-sm hover:bg-primary-700 whitespace-nowrap"
                              >
                                Beli Lagi
                              </button>
                              {order.isRated ? (
                                <button
                                  onClick={() =>
                                    handleOpenRatingModal(order, true)
                                  }
                                  className="flex-1 px-4 py-2 text-xs font-medium transition-all border rounded-sm sm:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 sm:text-sm whitespace-nowrap"
                                >
                                  Lihat Penilaian
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenRatingModal(order)}
                                  className="flex-1 px-4 py-2 text-xs font-medium transition-all border rounded-sm sm:flex-none border-primary-600 text-primary-600 sm:text-sm hover:bg-primary-50 whitespace-nowrap"
                                >
                                  Beri Penilaian
                                </button>
                              )}
                            </>
                          ) : order.statusLabel === "Belum Bayar" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleCancelOrder(order.id_pesanan, order.id)
                                }
                                className="flex-1 px-4 py-2 text-xs font-medium border rounded-sm sm:flex-none border-slate-200 text-slate-600 sm:text-sm hover:bg-slate-50 whitespace-nowrap"
                              >
                                Batalkan Pesanan
                              </button>
                              <button
                                onClick={() => {
                                  if (order.snap_token) {
                                    handlePayNow(order.snap_token);
                                  } else {
                                    router.push(`/user/purchase/${order.id}`);
                                  }
                                }}
                                className="flex-1 px-4 py-2 text-xs font-medium text-white rounded-sm shadow-md sm:flex-none bg-primary-600 sm:text-sm hover:bg-primary-700 whitespace-nowrap"
                              >
                                Bayar Sekarang
                              </button>
                            </>
                          ) : order.statusLabel === "Dikirim/Siap Diambil" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleOpenChat(order.storeId, order.storeName)
                                }
                                className="flex-1 px-4 py-2 text-xs font-medium border rounded-sm sm:flex-none border-slate-200 text-slate-600 sm:text-sm hover:bg-slate-50 whitespace-nowrap"
                              >
                                Hubungi Penjual
                              </button>
                              <button
                                onClick={() =>
                                  handleCompleteOrder(order.id_pesanan)
                                }
                                className="flex-1 px-4 py-2 text-xs font-medium text-white rounded-sm shadow-md sm:flex-none bg-primary-600 sm:text-sm hover:bg-primary-700 whitespace-nowrap"
                              >
                                Pesanan Diterima
                              </button>
                            </>
                          ) : order.statusLabel === "Sedang Dikemas" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleOpenChat(order.storeId, order.storeName)
                                }
                                className="flex-1 px-4 py-2 text-xs font-medium border rounded-sm sm:flex-none border-slate-200 text-slate-600 sm:text-sm hover:bg-slate-50 whitespace-nowrap"
                              >
                                Hubungi Penjual
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleBuyAgain(
                                    order.items.map((item) => ({
                                      id_produk: item.id_produk,
                                      quantity: item.quantity,
                                    })),
                                  )
                                }
                                className="flex-1 px-4 py-2 text-xs font-medium text-white transition-all rounded-sm shadow-md sm:flex-none bg-primary-600 sm:text-sm hover:bg-primary-700 whitespace-nowrap"
                              >
                                Beli Lagi
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && ratingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md overflow-hidden bg-white rounded-sm shadow-lg"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {isReadOnlyRating ? "Detail Penilaian" : "Penilaian Pesanan"}
              </h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1 text-center">
                <p className="text-xs tracking-wider uppercase text-slate-500">
                  {isReadOnlyRating
                    ? "Sub-toko yang Dinilai"
                    : "Menilai Sub-toko"}
                </p>
                <p className="text-base font-bold text-slate-800">
                  {ratingOrder.storeName}
                </p>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isReadOnlyRating && setRatingValue(star)}
                    disabled={isReadOnlyRating}
                    className={`focus:outline-none transition-transform ${
                      isReadOnlyRating ? "cursor-default" : "active:scale-95"
                    }`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingValue
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Ulasan / Komentar
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) =>
                    !isReadOnlyRating && setRatingComment(e.target.value)
                  }
                  disabled={isReadOnlyRating}
                  placeholder={
                    isReadOnlyRating
                      ? "Tidak ada komentar."
                      : "Bagikan pengalaman Anda berbelanja di sub-toko ini..."
                  }
                  className="w-full h-24 p-2 text-sm border rounded-sm resize-none border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 disabled:bg-slate-50"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50">
              {isReadOnlyRating ? (
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="px-6 py-2 text-sm font-medium text-white transition-colors rounded-sm shadow-md bg-primary-600 hover:bg-primary-700"
                >
                  Tutup
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    disabled={isSubmittingRating}
                    className="px-4 py-2 text-sm font-medium transition-colors border rounded-sm border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitRating}
                    disabled={isSubmittingRating}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-sm shadow-md bg-primary-600 hover:bg-primary-700"
                  >
                    {isSubmittingRating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Penilaian"
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
