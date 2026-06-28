"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Check, X, Search, AlertCircle, Loader2, ChevronRight, MapPin, Clock, QrCode, Truck, MessageCircle, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";

const DeliveryTracker = dynamic(() => import("@/components/delivery/DeliveryTracker"), { ssr: false });
const QRScanner = dynamic(() => import("@/components/delivery/QRScanner"), { ssr: false });
const BatchDeliveryModal = dynamic(() => import("@/components/delivery/BatchDeliveryModal"), { ssr: false });

type OrderStatus = "menunggu_pembayaran" | "menunggu_konfirmasi" | "menunggu_produksi" | "diproses" | "siap_diambil" | "dikirim" | "selesai" | "dibatalkan";

interface Order {
  id_pesanan: string;
  kode_unik: string;
  total_harga: number;
  status_pesanan: OrderStatus;
  alamat_pengambilan: string | null;
  is_preorder: boolean;
  is_tujuan_aktif: boolean;
  urutan_antar: number | null;
  id_ronde: string | null;
  tgl_pesan: string;
  dicatat_oleh: string | null;
  pengguna: { nama: string; email: string } | null;
  pembayaran: { metode_pembayaran: string; status_bayar: string } | null;
  detail_pesanan: { jumlah: number; metode_pengambilan: string | null; tgl_ambil: string | null; produk: { nama_produk: string } | null }[];
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_konfirmasi: "Menunggu Konfirmasi",
  menunggu_produksi: "Sedang Diproduksi",
  diproses: "Diproses",
  siap_diambil: "Siap Diambil",
  dikirim: "Dalam Pengiriman",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-slate-100 text-slate-600",
  menunggu_konfirmasi: "bg-amber-100 text-amber-700",
  menunggu_produksi: "bg-orange-100 text-orange-700",
  diproses: "bg-blue-100 text-blue-700",
  siap_diambil: "bg-violet-100 text-violet-700",
  dikirim: "bg-sky-100 text-sky-700",
  selesai: "bg-emerald-100 text-emerald-700",
  dibatalkan: "bg-red-100 text-red-600",
};

const METHOD_COLOR: Record<string, string> = {
  qris: "bg-purple-100 text-purple-700",
  transfer: "bg-blue-100 text-blue-700",
  tunai: "bg-emerald-100 text-emerald-700",
};

const FILTER_TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Konfirmasi", value: "menunggu_konfirmasi" },
  { label: "Diproduksi", value: "menunggu_produksi" },
  { label: "Diproses", value: "diproses" },
  { label: "Siap Ambil", value: "siap_diambil" },
  { label: "Dikirim", value: "dikirim" },
  { label: "Selesai", value: "selesai" },
  { label: "Batal", value: "dibatalkan" },
];

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { active } = useDashboard();
  const idSubToko = active?.id_sub_toko ?? null;
  const idMember = active?.id_member ?? null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Track recently accepted orders for 10s cancel window: id_pesanan → accepted timestamp
  const [recentlyAccepted, setRecentlyAccepted] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);

  const fetchOrders = useCallback(async (subTokoId: string) => {
    const { data, error } = await supabase
      .from("pesanan")
      .select(`
        id_pesanan, kode_unik, total_harga, status_pesanan, alamat_pengambilan, is_preorder, is_tujuan_aktif, urutan_antar, id_ronde, tgl_pesan, dicatat_oleh,
        pengguna:id_pengguna(nama, email),
        pembayaran(metode_pembayaran, status_bayar),
        detail_pesanan(jumlah, metode_pengambilan, tgl_ambil, id_produk, produk:id_produk(nama_produk))
      `)
      .eq("id_sub_toko", subTokoId)
      .order("tgl_pesan", { ascending: false });

    if (error) {
      console.error("[OrdersPage - fetchOrders] Error detail:", JSON.stringify(error));
      return;
    }

    setOrders((data as any) ?? []);
  }, [supabase]);

  useEffect(() => {
    if (!idSubToko) { setLoading(false); return; }
    setLoading(true);
    fetchOrders(idSubToko).then(() => setLoading(false));
  }, [idSubToko, fetchOrders]);

  // Tick every second for countdown displays
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const updateStatus = async (id_pesanan: string, newStatus: OrderStatus) => {
    if (!idMember || !idSubToko) return;
    setProcessingId(id_pesanan);
    try {
      const updatePayload: any = { status_pesanan: newStatus };
      if (newStatus === "diproses") {
        updatePayload.dicatat_oleh = idMember;
      }
      if (newStatus === "dikirim") {
        updatePayload.pengantar_id = idMember;
        updatePayload.is_tujuan_aktif = true;
      }
      const { error } = await supabase
        .from("pesanan")
        .update(updatePayload)
        .eq("id_pesanan", id_pesanan);

      if (error) throw error;

      // Batch: activate next order in same ronde
      if (newStatus === "selesai") {
        const currentOrder = orders.find(o => o.id_pesanan === id_pesanan);
        if (currentOrder?.id_ronde && currentOrder.urutan_antar) {
          const nextUrutan = currentOrder.urutan_antar + 1;
          const nextOrder = orders.find(o => o.id_ronde === currentOrder.id_ronde && o.urutan_antar === nextUrutan);
          if (nextOrder) {
            await supabase.from("pesanan").update({ is_tujuan_aktif: true }).eq("id_pesanan", nextOrder.id_pesanan);
            setOrders((prev) => prev.map((o) => o.id_pesanan === nextOrder.id_pesanan ? { ...o, is_tujuan_aktif: true } : o));
          }
        }
      }

      // Track accept time for 10s cancel window
      if (newStatus === "diproses" || newStatus === "menunggu_produksi") {
        setRecentlyAccepted((prev) => ({ ...prev, [id_pesanan]: Date.now() }));
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id_pesanan === id_pesanan
            ? { ...o, status_pesanan: newStatus, dicatat_oleh: newStatus === "diproses" ? idMember : o.dicatat_oleh }
            : o
        )
      );
    } catch (err) {
      console.error("[OrdersPage - updateStatus] Error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      const res = await fetch("/api/orders/seller-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pesanan: rejectTarget, alasan_batal: rejectReason.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        console.error("[OrdersPage - handleReject] Error:", d.error);
        return;
      }
      setOrders((prev) => prev.map((o) => o.id_pesanan === rejectTarget ? { ...o, status_pesanan: "dibatalkan" } : o));
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      console.error("[OrdersPage - handleReject] Error:", err);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSellerCancelAfterAccept = async (id_pesanan: string) => {
    setProcessingId(id_pesanan);
    try {
      const res = await fetch("/api/orders/seller-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pesanan, alasan_batal: "Dibatalkan oleh penjual." }),
      });
      if (!res.ok) return;
      setOrders((prev) => prev.map((o) => o.id_pesanan === id_pesanan ? { ...o, status_pesanan: "dibatalkan" } : o));
      setRecentlyAccepted((prev) => { const n = { ...prev }; delete n[id_pesanan]; return n; });
    } catch (err) {
      console.error("[OrdersPage - handleSellerCancelAfterAccept] Error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "all" || o.status_pesanan === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || o.kode_unik.toLowerCase().includes(q) || o.pengguna?.nama.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = orders.filter((o) => o.status_pesanan === "menunggu_konfirmasi").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan Masuk</h1>
          <p className="text-sm text-slate-500">Kelola dan verifikasi pesanan dari pembeli.</p>
        </div>
        <div className="flex gap-2">
          {batchSelected.size >= 2 && (
            <button
              onClick={() => setShowBatch(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Truck className="w-4 h-4" /> Antar Batch ({batchSelected.size})
            </button>
          )}
        </div>
      </div>

      {showBatch && idMember && (
        <BatchDeliveryModal
          orders={filtered.filter(o => batchSelected.has(o.id_pesanan)).map(o => ({
            id_pesanan: o.id_pesanan,
            kode_unik: o.kode_unik,
            pengguna: o.pengguna,
            alamat_pengambilan: o.alamat_pengambilan,
          }))}
          memberId={idMember}
          onClose={() => { setShowBatch(false); setBatchSelected(new Set()); }}
          onSuccess={(_, updatedIds) => {
            setOrders(prev => prev.map(o => updatedIds.includes(o.id_pesanan) ? { ...o, status_pesanan: "dikirim" } : o));
            setBatchSelected(new Set());
          }}
        />
      )}


      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 text-sm">{pendingCount} Pesanan Perlu Konfirmasi</h3>
            <p className="text-xs text-amber-700">Segera proses pesanan yang menunggu konfirmasi.</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === tab.value
                ? "bg-primary-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status_pesanan === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode pesanan atau nama pembeli..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Tidak ada pesanan ditemukan.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((order, i) => {
              const itemSummary = order.detail_pesanan
                ?.map((d) => `${d.produk?.nama_produk ?? "?"} (${d.jumlah}x)`)
                .join(", ") ?? "—";
              const isProcessing = processingId === order.id_pesanan;
              const canBatch = order.status_pesanan === "diproses" && order.detail_pesanan?.some(d => d.metode_pengambilan === "delivery");

              return (
                <div
                  key={order.id_pesanan}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                  {canBatch && (
                    <input
                      type="checkbox"
                      checked={batchSelected.has(order.id_pesanan)}
                      onChange={(e) => {
                        const next = new Set(batchSelected);
                        e.target.checked ? next.add(order.id_pesanan) : next.delete(order.id_pesanan);
                        setBatchSelected(next);
                      }}
                      className="mt-1 w-4 h-4 accent-sky-600 shrink-0 cursor-pointer"
                    />
                  )}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 sm:gap-4 items-start sm:items-center">
                      {/* Kode + Status */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-slate-800 text-sm">{order.kode_unik}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR[order.status_pesanan]}`}>
                          {STATUS_LABEL[order.status_pesanan]}
                        </span>
                      </div>

                      {/* Detail */}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{order.pengguna?.nama ?? "—"}</p>
                        <p className="text-xs text-slate-500 truncate">{itemSummary}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.tgl_pesan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {/* Delivery/Pickup Info */}
                        {(() => {
                          const hasDelivery = order.detail_pesanan?.some(d => d.metode_pengambilan === "delivery");
                          const hasPickup = order.detail_pesanan?.some(d => d.metode_pengambilan === "pickup");
                          const pickupTime = order.detail_pesanan?.find(d => d.metode_pengambilan === "pickup")?.tgl_ambil;
                          return (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {hasDelivery && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                  <MapPin className="w-2.5 h-2.5" /> Diantar
                                </span>
                              )}
                              {hasPickup && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                  <Clock className="w-2.5 h-2.5" /> Ambil{pickupTime ? `: ${pickupTime}` : ""}
                                </span>
                              )}
                              {hasDelivery && order.alamat_pengambilan && (
                                <p className="text-[10px] text-blue-600 truncate max-w-xs">{order.alamat_pengambilan}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Harga + Metode */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
                        <span className="font-bold text-primary-600 text-sm">Rp {Number(order.total_harga).toLocaleString("id-ID")}</span>
                        {order.pembayaran && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${METHOD_COLOR[order.pembayaran.metode_pembayaran] ?? "bg-slate-100 text-slate-600"}`}>
                            {order.pembayaran.metode_pembayaran.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                      {order.status_pesanan === "menunggu_konfirmasi" && (
                        <>
                          <button
                            disabled={isProcessing}
                            onClick={() => updateStatus(order.id_pesanan, order.is_preorder ? "menunggu_produksi" : "diproses")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Terima
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => { setRejectTarget(order.id_pesanan); setRejectReason(""); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white text-xs font-bold rounded-lg border border-red-200 hover:border-red-500 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </>
                      )}
                      {/* 10s cancel window after seller accepts */}
                      {(() => {
                        const acceptedAt = recentlyAccepted[order.id_pesanan];
                        if (!acceptedAt) return null;
                        const elapsed = Math.floor((Date.now() - acceptedAt) / 1000);
                        const remaining = 10 - elapsed;
                        if (remaining <= 0) {
                          return (
                            <a
                              href="https://wa.me/6281234567890"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Hubungi CS
                            </a>
                          );
                        }
                        return (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleSellerCancelAfterAccept(order.id_pesanan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Timer className="w-3.5 h-3.5" />}
                            Batalkan ({remaining}d)
                          </button>
                        );
                      })()}
                      {order.status_pesanan === "menunggu_produksi" && (
                        <button
                          disabled={isProcessing}
                          onClick={() => updateStatus(order.id_pesanan, "diproses")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          Mulai Produksi
                        </button>
                      )}
                      {order.status_pesanan === "diproses" && (() => {
                        const hasDelivery = order.detail_pesanan?.some(d => d.metode_pengambilan === "delivery");
                        return hasDelivery ? (
                          <button
                            onClick={() => router.push(`/dashboard/delivery/${order.id_pesanan}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Mulai Antar
                          </button>
                        ) : (
                          <button
                            disabled={isProcessing}
                            onClick={() => updateStatus(order.id_pesanan, "siap_diambil")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            Siap Ambil
                          </button>
                        );
                      })()}
                      {order.status_pesanan === "siap_diambil" && (
                        <button
                          onClick={() => router.push(`/dashboard/pickup/${order.id_pesanan}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Konfirmasi Ambil
                        </button>
                      )}
                      {order.status_pesanan === "dikirim" && (
                        <button
                          onClick={() => router.push(`/dashboard/delivery/${order.id_pesanan}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Lihat Pengiriman
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Tolak Pesanan</h2>
              <button onClick={() => setRejectTarget(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Berikan alasan penolakan. Alasan ini akan disimpan pada data pesanan.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="cth. Stok habis, produk tidak tersedia..."
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectTarget(null)}
                disabled={isRejecting}
                className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-50"
              >
                {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                Tolak Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
