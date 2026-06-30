/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Store,
  MapPin,
  Receipt,
  Clock,
  Info,
  Package,
  Truck,
  Star,
  ChevronRight,
  X,
  Loader2,
  Navigation,
} from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import dynamic from "next/dynamic";

const QRCode = dynamic(() => import("qrcode.react").then(m => m.QRCodeSVG), { ssr: false });
const TrackingMap = dynamic(() => import("@/components/delivery/TrackingMap"), { ssr: false });

interface OrderDetail {
  id_pesanan: string;
  isRated: boolean;
  id: string; // kode_unik
  kode_unik: string;
  total_harga: number;
  status_pesanan: string;
  tgl_pesan: string;
  tgl_ambil: string | null;
  alamat_pengambilan: string;
  metode_pengambilan: string;
  storeName: string;
  storeId: string; // sub_toko id
  tokoId: string; // toko id
  items: Array<{
    id_produk: any;
    id: string;
    name: string;
    image: string;
    variation: string;
    quantity: number;
    price: number;
    metode_pengambilan: string;
    tgl_ambil: string | null;
    alamat_pengambilan: string | null;
    subToko?: any;
  }>;
  payment: {
    method: string;
    status: string;
    date: string | null;
  } | null;
  shippingFee: number;
  serviceFee: number;
  discount: number;
  ratingDetail?: {
    rating: number;
    komentar: string | null;
  } | null;
  snap_token?: string | null;
}

const mapStatusToStepIndex = (status: string) => {
  switch (status) {
    case "menunggu_pembayaran":
      return 0;
    case "menunggu_konfirmasi":
      return 1;
    case "diproses":
      return 2;
    case "siap_diambil":
    case "dikirim":
      return 3;
    case "selesai":
      return 4;
    case "dibatalkan":
      return -1;
    default:
      return 0;
  }
};

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
        </div>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingPos, setTrackingPos] = useState<{ lat: number; lng: number; updatedAt: string | null } | null>(null);
  const [pengantar, setPengantar] = useState<{ nama: string; no_telepon: string | null } | null>(null);

  // Rating Modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isReadOnlyRating, setIsReadOnlyRating] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const getBaseId = (kode: string) => {
        const lastHyphenIndex = kode.lastIndexOf("-");
        if (lastHyphenIndex !== -1) {
          const suffix = kode.substring(lastHyphenIndex + 1);
          if (!isNaN(Number(suffix))) {
            return kode.substring(0, lastHyphenIndex);
          }
        }
        return kode;
      };
      const baseId = getBaseId(id);

      const { data: pesananList, error } = await supabase
        .from("pesanan")
        .select(
          `
          id_pesanan,
          kode_unik,
          total_harga,
          status_pesanan,
          metode_pembayaran,
          tgl_pesan,
          alamat_pengambilan,
          snap_token,
          id_sub_toko,
          sub_toko (
            id_toko,
            nama_proker,
            toko (id_toko, nama_toko)
          ),
          ulasan (
            id_ulasan,
            rating,
            komentar
          ),
          detail_pesanan (
            id_detail,
            jumlah,
            harga_satuan,
            metode_pengambilan,
            tgl_ambil,
            produk (
              id_produk,
              nama_produk,
              foto,
              kategori,
              sub_toko (
                id_sub_toko,
                nama_proker,
                alamat
              )
            )
          )
        `,
        )
        .or(`kode_unik.eq.${baseId},kode_unik.like.${baseId}-%`)
        .eq("id_pengguna", user.id);

      if (error || !pesananList || pesananList.length === 0) {
        console.error("Order not found", error);
        router.push("/user/purchase");
        return;
      }

      // Check if any sibling order is unpaid
      const isUnpaid = pesananList.some(
        (p: any) => p.status_pesanan === "menunggu_pembayaran",
      );

      let pesanan: any;
      let siblingOrders: any[] = [];

      if (isUnpaid) {
        pesanan = pesananList[0];
        siblingOrders = pesananList.slice(1);
      } else {
        // Paid: show exact match from URL id, default to first item
        const exactMatch = pesananList.find((p: any) => p.kode_unik === id);
        pesanan = exactMatch || pesananList[0];
      }

      const subTokoObj = Array.isArray(pesanan.sub_toko)
        ? pesanan.sub_toko[0]
        : pesanan.sub_toko;
      const storeName = subTokoObj?.nama_proker || "Toko";
      const tokoId = subTokoObj?.id_toko || "";

      const allDetailPesanan = [...pesanan.detail_pesanan];
      let total_harga = Number(pesanan.total_harga);

      if (isUnpaid) {
        siblingOrders.forEach((sibling: any) => {
          allDetailPesanan.push(...sibling.detail_pesanan);
          total_harga += Number(sibling.total_harga);
        });
      }

      const hasDeliveryItem = allDetailPesanan.some(
        (dp: any) => dp.metode_pengambilan === "delivery",
      );
      const hasPickupItem = allDetailPesanan.some(
        (dp: any) => dp.metode_pengambilan === "pickup",
      );

      let metodePengambilan = "pickup";
      if (hasDeliveryItem && hasPickupItem) {
        metodePengambilan = "both";
      } else if (hasDeliveryItem) {
        metodePengambilan = "delivery";
      }

      const shippingFee = hasDeliveryItem ? 12000 : 0;
      const serviceFee = 1000;
      const discount = hasDeliveryItem ? -12000 : 0;

      const formattedOrder: OrderDetail = {
        id_pesanan: pesanan.id_pesanan,
        isRated: pesanan.ulasan && pesanan.ulasan.length > 0,
        id: pesanan.kode_unik,
        kode_unik: isUnpaid ? baseId : pesanan.kode_unik,
        total_harga: total_harga,
        status_pesanan: pesanan.status_pesanan,
        tgl_pesan: pesanan.tgl_pesan,
        tgl_ambil: null,
        alamat_pengambilan:
          pesanan.alamat_pengambilan || "Alamat tidak tersedia",
        metode_pengambilan: metodePengambilan,
        storeName:
          isUnpaid && pesananList.length > 1
            ? `${storeName} + ${pesananList.length - 1} Toko Lain`
            : storeName,
        storeId: pesanan.id_sub_toko,
        tokoId: tokoId,
        snap_token: pesanan.snap_token,

        items: allDetailPesanan.map((dp: any) => {
          const prodSubToko = dp.produk?.sub_toko;
          const standAddress =
            prodSubToko?.alamat ||
            `Stand ${prodSubToko?.nama_proker || "Toko"}, Gedung A Lt.1`;

          return {
            id: dp.id_detail,
            id_produk: dp.produk.id_produk,
            name: dp.produk?.nama_produk || "Produk",
            image:
              dp.produk?.foto || "https://placehold.co/100x100?text=No+Image",
            variation: dp.produk?.kategori || "Umum",
            quantity: dp.jumlah,
            price: dp.harga_satuan,
            metode_pengambilan: dp.metode_pengambilan || "pickup",
            tgl_ambil: dp.tgl_ambil || null,
            alamat_pengambilan:
              dp.metode_pengambilan === "pickup" ? standAddress : null,
            subToko: prodSubToko,
          };
        }),
        payment: pesanan.metode_pembayaran
          ? {
              method: pesanan.metode_pembayaran,
              status:
                pesanan.status_pesanan === "menunggu_pembayaran"
                  ? "menunggu"
                  : "dibayar",
              date: null,
            }
          : null,
        shippingFee,
        serviceFee,
        discount,
        ratingDetail:
          pesanan.ulasan && pesanan.ulasan.length > 0
            ? {
                rating: pesanan.ulasan[0].rating,
                komentar: pesanan.ulasan[0].komentar,
              }
            : null,
      };

      setOrder(formattedOrder);
    } catch (error) {
      console.error("Error", error);
      router.push("/user/purchase");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, supabase]);

  useEffect(() => {
    if (id) {
      queueMicrotask(() => {
        fetchOrderDetail();
      });
    }
  }, [id, fetchOrderDetail]);

  // Fetch initial tracking position + realtime when dikirim
  useEffect(() => {
    if (!order?.id_pesanan || order.status_pesanan !== "dikirim") return;

    supabase
      .from("pesanan")
      .select("lat_pengantar, lng_pengantar, lokasi_updated_at, pengantar_id")
      .eq("id_pesanan", order.id_pesanan)
      .single()
      .then(async ({ data }) => {
        if (data?.lat_pengantar && data?.lng_pengantar) {
          setTrackingPos({ lat: data.lat_pengantar, lng: data.lng_pengantar, updatedAt: data.lokasi_updated_at });
        }
        if (data?.pengantar_id) {
          const { data: memberData } = await supabase
            .from("sub_toko_member")
            .select("pengguna:id_pengguna(nama, no_telepon)")
            .eq("id_member", data.pengantar_id)
            .maybeSingle();
          const p = memberData?.pengguna as any;
          if (p?.nama) setPengantar({ nama: p.nama, no_telepon: p.no_telepon ?? null });
        }
      });

    const channel = supabase
      .channel(`track-inline:${order.id_pesanan}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pesanan", filter: `id_pesanan=eq.${order.id_pesanan}` }, (payload) => {
        const row = payload.new as any;
        if (row.status_pesanan === "selesai") { fetchOrderDetail(); return; }
        if (row.lat_pengantar && row.lng_pengantar) {
          setTrackingPos({ lat: row.lat_pengantar, lng: row.lng_pengantar, updatedAt: row.lokasi_updated_at });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.id_pesanan, order?.status_pesanan, supabase, fetchOrderDetail]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_unik: order.kode_unik }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membatalkan pesanan.");
      alert("Pesanan berhasil dibatalkan.");
      await fetchOrderDetail();
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      alert(err.message || "Gagal membatalkan pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;
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
        .eq("id_pesanan", order.id_pesanan);

      if (error) throw error;
      alert("Pesanan berhasil diselesaikan.");
      await fetchOrderDetail();
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
          fetchOrderDetail();
        },
        onPending: function () {
          alert("Menunggu pembayaran Anda!");
          fetchOrderDetail();
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

  const handleOpenRatingModal = (readOnly: boolean = false) => {
    if (readOnly && order?.ratingDetail) {
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
    if (!order) return;
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
        id_sub_toko: order.storeId,
        id_pesanan: order.id_pesanan,
        rating: ratingValue,
        komentar: ratingComment || null,
      });

      if (error) throw error;

      alert("Terima kasih atas penilaian Anda!");
      setShowRatingModal(false);
      await fetchOrderDetail();
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Gagal menyimpan ulasan. Silakan coba lagi.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("Rp", "Rp");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\./g, ":");
  };

  const formatPaymentMethod = (method: string | undefined) => {
    if (!method) return "-";
    switch (method.toLowerCase()) {
      case "qris":
        return "QRIS";
      case "transfer":
        return "Transfer Bank";
      case "tunai":
        return "Bayar Tunai (COD)";
      default:
        return method.toUpperCase();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Disalin ke clipboard!");
  };

  const handleOpenChat = (storeId?: string, storeName?: string) => {
    if (!order) return;
    const activeStoreId = storeId || order.storeId;
    const activeStoreName = storeName || order.storeName;
    const event = new CustomEvent("openProkerChat", {
      detail: {
        id_sub_toko: activeStoreId,
        name: activeStoreName,
        type: "toko",
        avatar: `https://placehold.co/100x100?text=${encodeURIComponent(activeStoreName.charAt(0))}`,
      },
    });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = mapStatusToStepIndex(order.status_pesanan);
  const isCanceled = order.status_pesanan === "dibatalkan";

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
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
          <aside className="hidden lg:block shrink-0">
            <UserSidebar />
          </aside>

          <div className="relative flex flex-col flex-1 min-w-0 gap-3 md:gap-4">
            {/* Mobile Header */}
            <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-white shadow-sm lg:hidden">
              <button
                onClick={() => router.back()}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h1 className="flex-1 text-lg font-semibold">Rincian Pesanan</h1>
            </div>

            {/* Desktop Header */}
            <div className="items-center justify-between hidden p-4 bg-white shadow-sm lg:flex md:rounded-sm">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 font-medium text-slate-600 hover:text-primary-600"
              >
                <ChevronLeft className="w-5 h-5" /> KEMBALI
              </button>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-slate-500">
                  NO. PESANAN. {order.kode_unik}
                </span>
                <span className="text-slate-300">|</span>
                <span className="uppercase text-primary-600">
                  {order.metode_pengambilan === "both" && (order.status_pesanan === "siap_diambil" || order.status_pesanan === "dikirim")
                    ? "DIKIRIM / SIAP DIAMBIL"
                    : order.status_pesanan.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Stepper Status (Desktop & Mobile combined layout) */}
            {!isCanceled && (
              <div className="p-6 overflow-x-auto bg-white shadow-sm md:rounded-sm">
                <div className="min-w-150 md:min-w-0">
                  <div className="relative flex items-start justify-between px-4">
                    <div className="absolute h-1 overflow-hidden rounded-full left-8 right-8 top-6 bg-slate-200 -z-10">
                      <div
                        className="h-full transition-all duration-500 bg-primary-600"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                      ></div>
                    </div>

                    {[
                      {
                        icon: Receipt,
                        label: "Pesanan Dibuat",
                        time: order.tgl_pesan
                          ? formatDate(order.tgl_pesan)
                          : "",
                      },
                      {
                        icon: Clock,
                        label: "Pesanan Dibayarkan",
                        time: order.payment?.date
                          ? formatDate(order.payment.date)
                          : "",
                      },
                      { icon: Package, label: "Sedang Dikemas", time: "" },
                      {
                        icon:
                          order.metode_pengambilan === "pickup" ? Store : Truck,
                        label:
                          order.metode_pengambilan === "pickup"
                            ? "Siap Diambil"
                            : order.metode_pengambilan === "delivery"
                              ? "Dikirim"
                              : "Dikirim/Siap Diambil",
                        time: "",
                      },
                      { icon: Star, label: "Belum Dinilai", time: "" },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center w-24 gap-2 text-center"
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${idx <= currentStep ? "bg-primary-50 border-primary-600 text-primary-600" : "bg-white border-slate-200 text-slate-300"} transition-colors duration-500`}
                        >
                          <step.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs font-medium ${idx <= currentStep ? "text-slate-800" : "text-slate-400"}`}
                          >
                            {step.label}
                          </span>
                          {step.time && (
                            <span className="text-[10px] text-slate-400 mt-1">
                              {step.time}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Status Banner if pending payment */}
            {order.status_pesanan === "menunggu_pembayaran" && (
              <div className="p-4 text-white lg:hidden bg-emerald-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Menunggu Pembayaran</h2>
                    <p className="mt-1 text-sm opacity-90">
                      Lakukan pembayaran sebelum batas waktu berakhir.
                    </p>
                  </div>
                  <Clock className="w-8 h-8 opacity-50" />
                </div>
              </div>
            )}

            {/* Live tracking map — fixed above address when dikirim */}
            {order.status_pesanan === "dikirim" && order.metode_pengambilan !== "pickup" && (
              <div className="bg-white border-t-2 shadow-sm md:rounded-sm border-sky-500">
                <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-sm font-semibold text-sky-700">
                  <Truck className="w-4 h-4" />
                  {pengantar ? `${pengantar.nama} sedang dalam perjalanan` : "Panitia sedang dalam perjalanan"}
                </div>
                <div className="h-56 mx-4 mb-1 rounded-xl overflow-hidden border border-slate-200">
                  {trackingPos ? (
                    <TrackingMap lat={trackingPos.lat} lng={trackingPos.lng} updatedAt={trackingPos.updatedAt} mapId={`inline-track-${order.id_pesanan}`} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400 text-sm">
                      <Navigation className="w-6 h-6 animate-pulse" />
                      <span>Menunggu lokasi panitia...</span>
                    </div>
                  )}
                </div>
                {trackingPos?.updatedAt && (
                  <p className="text-[10px] text-slate-400 px-4 pb-3 text-right">
                    Update: {new Date(trackingPos.updatedAt).toLocaleTimeString("id-ID")}
                  </p>
                )}
              </div>
            )}

            {/* Address Section */}
            {order.metode_pengambilan !== "pickup" && (
              <div className="relative bg-white border-t-2 shadow-sm md:rounded-sm border-primary-600">
                <div className="absolute top-0 left-0 w-full h-1 opacity-60"></div>

                <div className="flex flex-col gap-4 p-4 md:p-6 md:flex-row md:items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 text-lg font-medium text-slate-800">
                      <MapPin className="w-5 h-5" />
                      <h3>Alamat Pengiriman</h3>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 pl-7">
                      {/* <p className="font-bold text-slate-800">
                        {order.alamat_pengambilan?.split(",")[0] || "Oka"}
                      </p> */}
                      <p>{order.alamat_pengambilan}</p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Delivery person info */}
            {order.status_pesanan === "dikirim" && pengantar && (
              <div className="bg-white border-t shadow-sm md:rounded-sm px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Detail Pengirim</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm shrink-0">
                    {pengantar.nama.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{pengantar.nama}</p>
                    {pengantar.no_telepon ? (
                      <a
                        href={`tel:${pengantar.no_telepon}`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        {pengantar.no_telepon}
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400">Nomor tidak tersedia</p>
                    )}
                  </div>
                  {pengantar.no_telepon && (
                    <a
                      href={`https://wa.me/${pengantar.no_telepon.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Order Items Section */}
            <div className="overflow-hidden bg-white shadow-sm md:rounded-sm">
              {/* Group items by sub-toko */}
              {Object.values(
                order.items.reduce(
                  (
                    acc: Record<string, { subToko: any; items: any[] }>,
                    item,
                  ) => {
                    const subTokoId =
                      item.subToko?.id_sub_toko || order.storeId;
                    if (!acc[subTokoId]) {
                      acc[subTokoId] = {
                        subToko: item.subToko || {
                          id_sub_toko: order.storeId,
                          nama_proker: order.storeName,
                          id_toko: order.tokoId,
                        },
                        items: [],
                      };
                    }
                    acc[subTokoId].items.push(item);
                    return acc;
                  },
                  {},
                ),
              ).map((group: any) => (
                <div
                  key={group.subToko.id_sub_toko}
                  className="border-b last:border-b-0 border-slate-100"
                >
                  {/* QR + pickup info — both above store header */}
                  {order.status_pesanan === "siap_diambil" &&
                    group.items.some((i: any) => i.metode_pengambilan === "pickup" || i.metode_pengambilan === "both") && (() => {
                      const pickupItem = group.items.find((i: any) => i.metode_pengambilan === "pickup" || i.metode_pengambilan === "both");
                      return (
                        <div className="mx-4 mt-4 mb-0 space-y-3">
                          {/* Pickup info */}
                          {pickupItem && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                              <p className="font-semibold text-slate-700 mb-1.5">📍 Info Pick Up</p>
                              <p className="text-slate-500">
                                <span className="font-medium text-slate-600">Lokasi Stand: </span>
                                {pickupItem.alamat_pengambilan || "Stand Toko, Gedung A Lt.1"}
                              </p>
                              {pickupItem.tgl_ambil && (
                                <p className="text-slate-500">
                                  <span className="font-medium text-slate-600">Waktu Ambil: </span>
                                  {pickupItem.tgl_ambil}
                                </p>
                              )}
                            </div>
                          )}
                          {/* QR code */}
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-4">Tunjukkan ke Panitia saat Ambil</p>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                              <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm shrink-0">
                                <QRCode value={order.kode_unik} size={120} />
                              </div>
                              <div className="flex-1 text-center sm:text-left">
                                <p className="text-xs text-slate-500 mb-1">Kode Pesanan</p>
                                <p className="font-mono font-extrabold text-2xl text-slate-900 tracking-widest mb-2">{order.kode_unik}</p>
                                <p className="text-xs text-slate-400">Tunjukkan QR atau sebutkan kode ini kepada panitia</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/10">
                    <div
                      className="flex items-center gap-2 text-sm font-bold cursor-pointer text-slate-800"
                      onClick={() =>
                        router.push(
                          `/organizations/${group.subToko.id_toko}/${group.subToko.id_sub_toko}`,
                        )
                      }
                    >
                      <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Star+
                      </span>
                      {group.subToko.nama_proker}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleOpenChat(
                            group.subToko.id_sub_toko,
                            group.subToko.nama_proker,
                          )
                        }
                        className="flex items-center gap-1.5 border border-primary-600 text-primary-600 px-3 py-1 rounded text-xs font-medium hover:bg-primary-50"
                      >
                        Chat
                      </button>
                      <Link
                        href={`/organizations/${group.subToko.id_toko}/${group.subToko.id_sub_toko}`}
                        className="hidden md:flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1 rounded text-xs font-medium hover:bg-slate-50"
                      >
                        Kunjungi Toko
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {group.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative w-20 h-20 border rounded cursor-pointer bg-slate-100 border-slate-200 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                            unoptimized
                            onClick={() =>
                              router.push(`/explore/${item.id_produk}`)
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="text-sm font-medium cursor-pointer text-slate-800 line-clamp-2 hover:text-primary-600"
                            onClick={() =>
                              router.push(`/explore/${item.id_produk}`)
                            }
                          >
                            {item.name}
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Variasi: {item.variation}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            x{item.quantity}
                          </p>
                        </div>
                        <div className="flex flex-col justify-start text-right">
                          <span className="text-sm font-medium text-primary-600">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end p-4 border-t bg-slate-50 border-slate-100">
                <div className="flex items-center w-full gap-4 text-sm md:w-auto">
                  <div className="flex-1 text-slate-600 md:flex-none">
                    Total Pesanan:
                  </div>
                  <div className="text-lg font-bold text-primary-600">
                    {formatPrice(order.total_harga)}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary (Details) */}
            <div className="p-4 space-y-3 text-sm bg-white shadow-sm md:rounded-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span>
                  {formatPrice(
                    order.items.reduce((s, i) => s + i.price * i.quantity, 0),
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal Pengiriman</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discount !== 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    Total Diskon Pengiriman <Info className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-emerald-600">
                    {formatPrice(order.discount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  Biaya Layanan <Info className="w-3.5 h-3.5" />
                </span>
                <span>{formatPrice(order.serviceFee)}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-800">
                  Total Pembayaran
                </span>
                <span className="text-xl font-bold text-primary-600">
                  {formatPrice(order.total_harga)}
                </span>
              </div>
            </div>

            {/* Order Details Footer */}
            <div className="p-4 space-y-3 text-xs bg-white shadow-sm md:rounded-sm md:text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">No. Pesanan</span>
                <div className="flex items-center gap-2 font-medium uppercase text-slate-800">
                  {order.kode_unik}
                  <button
                    onClick={() => copyToClipboard(order.kode_unik)}
                    className="ml-2 font-bold text-primary-600"
                  >
                    SALIN
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Waktu Pemesanan</span>
                <span>{formatDate(order.tgl_pesan)}</span>
              </div>
              {/* {order.payment?.date && (
                <div className="flex items-center justify-between">
                  <span>Waktu Pembayaran</span>
                  <span>{formatDate(order.payment.date)}</span>
                </div>
              )} */}
              <div className="flex items-center justify-between">
                <span>Metode Pembayaran</span>
                <span className="font-medium text-slate-800">
                  {formatPaymentMethod(order.payment?.method)}
                </span>
              </div>
            </div>

            {/* Action Buttons: Sticky Bottom on Mobile, static right on Desktop */}
            <div className="sticky left-0 right-0 z-50 p-3 bg-white border-t bottom-4 border-slate-100 md:p-0 md:bg-transparent md:border-none">
              <div className="flex justify-end gap-3 mx-auto max-w-7xl md:gap-4 md:bg-white md:p-4 md:shadow-sm md:rounded-sm">
                {order.status_pesanan === "menunggu_pembayaran" && (
                  <>
                    <button
                      onClick={handleCancelOrder}
                      className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
                    >
                      Batalkan Pesanan
                    </button>
                    <button
                      onClick={() => handlePayNow(order.snap_token)}
                      className="flex-1 md:flex-none px-6 py-2.5 bg-primary-600 text-white font-medium rounded hover:bg-primary-700 shadow-md transition-colors"
                    >
                      Bayar Sekarang
                    </button>
                  </>
                )}

                {order.status_pesanan === "selesai" && (
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
                      className="flex-1 md:flex-none px-6 py-2.5 bg-primary-600 text-white font-medium rounded hover:bg-primary-700 shadow-md transition-colors"
                    >
                      Beli Lagi
                    </button>
                    {order.isRated ? (
                      <button
                        onClick={() => handleOpenRatingModal(true)}
                        className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
                      >
                        Lihat Penilaian
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenRatingModal(false)}
                        className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
                      >
                        Beri Penilaian
                      </button>
                    )}
                  </>
                )}

                {(order.status_pesanan === "dikirim" ||
                  order.status_pesanan === "siap_diambil") && (
                  <>
                    <button
                      onClick={() => handleOpenChat()}
                      className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Hubungi Penjual
                    </button>
                  </>
                )}

                {(order.status_pesanan === "diproses" ||
                  order.status_pesanan === "menunggu_konfirmasi") && (
                  <button
                    onClick={() => handleOpenChat()}
                    className="flex-1 md:flex-none px-6 py-2.5 border border-primary-600 text-primary-600 font-medium rounded hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Store className="w-5 h-5" /> Hubungi Penjual
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-left bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md overflow-hidden bg-white rounded-sm shadow-lg"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 md:text-base">
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
                  {order.storeName}
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
