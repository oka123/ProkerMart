"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  Ticket,
  ShieldCheck,
} from "lucide-react";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Paket Nasi Ayam Geprek Level 3",
      organizer: "HIMAIF - Dies Natalis",
      price: 15000,
      quantity: 2,
      maxStock: 50,
      category: "Makanan",
    },
    {
      id: 2,
      name: "Merchandise Kaos Dies Natalis (Hitam L)",
      organizer: "HIMA TI - IT Expo",
      price: 85000,
      quantity: 1,
      maxStock: 12,
      category: "Pakaian",
    },
  ]);

  const updateQuantity = (id: number, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeItem = (id: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const platformFee = 2000;
  const grandTotal = subtotal > 0 ? subtotal + platformFee : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
        {/* Header & Tombol Kembali */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/explore"
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Keranjang Belanja
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Keranjangmu masih kosong
            </h2>
            <p className="text-slate-500 mb-6 max-w-sm">
              Yuk, mulai eksplorasi berbagai produk dan kegiatan proker kampus
              yang menarik!
            </p>
            <Link
              href="/explore"
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition"
            >
              Mulai Eksplorasi
            </Link>
          </div>
        ) : (
          /* ===== PERBAIKAN STRUKTUR LAYOUT UTAMA ===== */
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* KOLOM KIRI: Daftar Produk (Lebar 2/3 di layar besar) */}
            <div className="w-full lg:w-2/3 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex gap-4 sm:gap-6"
                >
                  {/* Gambar Placeholder (Terkunci ukurannya dengan flex-none) */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center flex-none">
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  </div>

                  {/* Detail Produk (min-w-0 mencegah teks merusak flexbox) */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md mb-2 inline-block">
                        {item.organizer}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mb-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm font-bold text-blue-600">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Aksi: Hapus & Kuantitas */}
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition p-1.5 -ml-1.5 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>

                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden flex-none">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-semibold text-slate-800 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.min(item.maxStock, item.quantity + 1),
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* KOLOM KANAN: Ringkasan Belanja (Lebar 1/3 di layar besar) */}
            <div className="w-full lg:w-1/3 flex-none">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Ringkasan Belanja
                </h3>

                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Harga ({totalItems} barang)</span>
                    <span className="font-semibold text-slate-800">
                      Rp {subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Layanan</span>
                    <span className="font-semibold text-slate-800">
                      Rp {platformFee.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Promo/Voucher (Dummy) */}
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 cursor-pointer hover:bg-blue-100 transition">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <Ticket className="w-4 h-4" />
                    Pakai Promo / Voucher
                  </div>
                  <span className="text-blue-500 text-xs font-bold">
                    Pilih &gt;
                  </span>
                </div>

                <hr className="border-slate-200 mb-4" />

                <div className="flex justify-between items-end mb-6">
                  <span className="font-bold text-slate-900">
                    Total Tagihan
                  </span>
                  <span className="text-xl font-extrabold text-blue-600">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </span>
                </div>

                <button className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition shadow-sm mb-3">
                  Lanjut ke Pembayaran
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Transaksi aman dan terpercaya</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
