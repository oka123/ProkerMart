"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  MapPin,
  Package,
  CreditCard,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

export default function ProductDetail() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  // Fungsi saat tombol Keranjang diklik
  const handleAddToCart = () => {
    setShowNotification(true);
    // Notifikasi akan hilang otomatis setelah 3 detik (3000 ms)
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Fungsi saat tombol Checkout diklik
  const handleCheckout = () => {
    // Arahkan pembeli langsung ke halaman keranjang
    router.push("/cart");
  };

  const dummyProduct = {
    name: "Paket Nasi Ayam Geprek Level 3",
    organizer: "HIMAIF - Dies Natalis",
    price: 15000,
    description:
      "Ayam geprek pedas nampol dengan bumbu rahasia.\n\nCocok untuk menemani nugas coding semalaman atau konsumsi rapat proker. Sudah termasuk es teh manis!",
    stock: 50,
    pickupLocation: "Stand FMIPA, Gedung A Lt.1",
    category: "Makanan",
  };

  const totalPrice = dummyProduct.price * quantity;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/explore" className="hover:text-blue-600 transition">
            Eksplor
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/explore" className="hover:text-blue-600 transition">
            {dummyProduct.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-800 font-medium truncate max-w-[200px]">
            {dummyProduct.name}
          </span>
        </nav>

        {/* ===== BAGIAN ATAS: GAMBAR + INFO PRODUK ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* KOLOM KIRI - Gambar */}
            <div className="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-8 md:pt-12 flex items-start justify-center min-h-[300px] md:min-h-[420px]">
              <div className="w-full max-w-[280px] aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
                <ShoppingBag className="w-20 h-20 text-slate-300" />
                <p className="text-xs text-slate-400">
                  Belum ada gambar produk
                </p>
              </div>
            </div>

            {/* KOLOM KANAN - Info & Form */}
            <div className="p-6 md:p-8 flex flex-col">
              {/* Badge & Judul */}
              <div className="mb-5">
                <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  {dummyProduct.organizer}
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mt-1">
                  {dummyProduct.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-blue-600">
                    Rp {dummyProduct.price.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-2 mb-2">
                  Stok tersisa:{" "}
                  <span className="font-semibold text-slate-700">
                    {dummyProduct.stock} item
                  </span>
                </p>
              </div>

              {/* =====  DESKRIPSI PRODUK  ===== */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-800 mb-2">
                  📋 Deskripsi Produk
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-1">
                  {dummyProduct.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100 mb-1">
                    <span className="text-slate-500 ">Kategori: </span>
                    <span className="font-semibold text-slate-800">
                      {dummyProduct.category}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 mb-5" />

              {/* Form Pembelian */}
              <div className="flex flex-col gap-6 flex-1">
                {/* Kuantitas */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    Jumlah Pembelian
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-semibold text-slate-800 text-sm">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            Math.min(dummyProduct.stock, quantity + 1),
                          )
                        }
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-slate-500">
                      Maks. {dummyProduct.stock} item
                    </span>
                  </div>
                </div>

                {/* Metode Pengambilan */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Metode Pengambilan
                  </label>
                  <select className="border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-full">
                    <option value="stand">
                      🏪 Ambil di Stand — {dummyProduct.pickupLocation}
                    </option>
                    <option value="delivery">🛵 Diantar (Area Kampus)</option>
                  </select>
                </div>

                {/* Metode Pembayaran */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Metode Pembayaran
                  </label>
                  <select className="border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-full">
                    <option value="qris">📱 QRIS / E-Wallet</option>
                    <option value="transfer">🏦 Transfer Bank</option>
                    <option value="cash">💵 Tunai (Saat COD)</option>
                  </select>
                </div>

                {/* Ringkasan Total */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-1">
                  <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
                    <span>Harga satuan</span>
                    <span>Rp {dummyProduct.price.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                    <span>Jumlah</span>
                    <span>×{quantity}</span>
                  </div>
                  <hr className="border-blue-200 mb-2" />
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-blue-600 text-lg">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 md:flex-none md:w-40 bg-emerald-600 text-black font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Keranjang
                  </button>

                  {/* <button
                    type="button"
                    onClick={handleCheckout} // <--- Panggil fungsi Checkout
                    className="flex-1 md:flex-none md:w-40 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-sm"
                  >
                    Checkout
                  </button> */}
                </div>

                {/* =====  INFO LOKASI  ===== */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mt-2">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Detail Lokasi
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">
                        Lokasi Pengambilan
                      </p>
                      <p className="text-sm text-slate-800 font-semibold">
                        {dummyProduct.pickupLocation}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">
                        Jam Operasional
                      </p>
                      <p className="text-sm text-slate-800 font-semibold">
                        08.00 – 16.00 WITA
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">
                        Area Pengiriman
                      </p>
                      <p className="text-sm text-slate-800 font-semibold">
                        Dalam Lingkungan Kampus
                      </p>
                    </div>
                  </div>
                </div>
                {/* ==================================================== */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ===== NOTIFIKASI TOAST ===== */}
      {showNotification && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">
            Produk berhasil ditambahkan ke keranjang!
          </span>
        </div>
      )}
    </div>
  );
}
