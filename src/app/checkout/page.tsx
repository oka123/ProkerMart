"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Navbar } from "@/components/Navbar";
import {
  ArrowLeft,
  MapPin,
  Truck,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle,
  ShoppingBag,
  Copy,
  AlertCircle,
  Navigation,
  Map,
  Search,
  Loader2,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "transfer" | "cod" | null>(null);
  const [hasSavedAddress, setHasSavedAddress] = useState(false); // Toggle ini untuk mensimulasikan sudah ada alamat/belum

  // Pick Up States
  const [pickupTime, setPickupTime] = useState("");
  const [newAddressDetail, setNewAddressDetail] = useState("");
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // States for Notifications/Modals
  const [showToast, setShowToast] = useState(false);

  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);

  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => { document.body.removeChild(script); }
  }, []);




  // Dummy Product Data
  useEffect(() => {
    const savedItems = localStorage.getItem('checkoutItems');
    if (savedItems) {
      // Ubah teks JSON kembali menjadi bentuk Array/Object
      setCheckoutItems(JSON.parse(savedItems));
    } else {
      // (Opsional) Jika tidak ada data, kembalikan user ke keranjang
      // router.push('/cart');
    }
  }, []);

  // Menghitung subtotal dari seluruh barang yang ada di checkoutItems
  const subtotal = checkoutItems.reduce((acc, item) => acc + (Number(item.produk.harga) * item.jumlah), 0);
  const platformFee = 2000;
  const grandTotal = subtotal > 0 ? subtotal + platformFee : 0;


  const handleCurrentLocation = () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      setNewAddressDetail("Jl. Raya Kampus Unud, Jimbaran, Kec. Kuta Sel., Kabupaten Badung, Bali 80361");
      setIsDetectingLocation(false);
    }, 1500);
  };

  const handlePaymentSelect = (method: "qris" | "transfer" | "cod") => {
    if (!deliveryMethod) {
      setShowPaymentAlert(true);
      return;
    }
    setShowPaymentAlert(false);
    setPaymentMethod(method);
  };

  const searchParams = useSearchParams();
  const jalur = searchParams.get('jalur');

  useEffect(() => {
    if (jalur === 'langsung') {
      // --- SKENARIO BELI LANGSUNG ---
      const savedItem = sessionStorage.getItem("directCheckoutItem");
      if (savedItem) {
        const parsedItem = JSON.parse(savedItem);
        console.log("CCTV Beli Langsung:", parsedItem); // Pasang log untuk mengecek

        // Ganti 'setCheckoutItems' dengan nama fungsi state Bli yang sebenarnya
        setCheckoutItems(parsedItem);
      }
    } else {
      // --- SKENARIO KERANJANG NORMAL ---
      // Fungsi fetch database HANYA boleh dipanggil di dalam blok 'else' ini
      // Contoh: fetchCartFromSupabase();
    }
  }, [jalur]);

  const handleCheckout = async () => {
    if (!deliveryMethod || !paymentMethod) return;

    try {
      // 1. Tembak API lokal kita dengan data DINAMIS
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_harga: Math.round(grandTotal),
          nama_kustomer: 'Pembeli',
          email_kustomer: 'pembeli@prokermart.com',
          items: checkoutItems,
          metode_pengambilan: deliveryMethod,
          metode_pembayaran: paymentMethod,
          id_pengguna: "123-abc-id-sementara",
          jalur_checkout: jalur === 'langsung' ? 'langsung' : 'keranjang'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses pesanan");
      }

      if (data.isCod) {
        localStorage.removeItem("checkoutItems");
        sessionStorage.removeItem("directCheckoutItem"); // ← bersihkan localStorage
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          router.replace("/user/purchase"); // ← replace agar tidak bisa back ke checkout
        }, 2000);

        // 2. Munculkan Pop-up Midtrans jika token berhasil didapat
      } else if (data.token) {
        // Menggunakan (window as any) agar TypeScript tidak protes
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log('Berhasil!', result);
            localStorage.removeItem("checkoutItems");
            sessionStorage.removeItem("directCheckoutItem");
            router.replace("/user/purchase"); // Arahkan ke pesanan saya
          },
          onPending: function (result: any) {
            console.log('Menunggu pembayaran!', result);
            localStorage.removeItem("checkoutItems");
            sessionStorage.removeItem("directCheckoutItem");
            router.replace("/user/purchase"); // Arahkan ke pesanan saya agar bisa dicek statusnya
          },
          onError: function (result: any) {
            console.log('Gagal!', result);
            alert("Pembayaran gagal diproses. Silakan coba lagi.");
          },
          onClose: function () {
            console.log('Pop-up ditutup tanpa menyelesaikan pembayaran');
            // Opsional: Bisa munculkan toast "Pembayaran dibatalkan"
          }
        });
      } else {
        alert("Gagal mendapatkan token dari server. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Terjadi kesalahan saat memanggil API Midtrans:", error);
      alert("Terjadi kesalahan sistem. Pastikan server API berjalan.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-10">
        {/* Tombol Kembali */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition mb-6 font-medium text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-8">Checkout Pesanan</h1>

        <div className="space-y-6">
          {/* 1. Metode Pengambilan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Metode Pengambilan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Card Select: Pick Up */}
              <div
                onClick={() => setDeliveryMethod("pickup")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${deliveryMethod === "pickup"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300"
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${deliveryMethod === "pickup" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${deliveryMethod === "pickup" ? "text-blue-900" : "text-slate-700"}`}>Pick Up</h3>
                    <p className="text-xs text-slate-500">Ambil sendiri di stand</p>
                  </div>
                </div>
              </div>

              {/* Card Select: Delivery */}
              <div
                onClick={() => setDeliveryMethod("delivery")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${deliveryMethod === "delivery"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300"
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${deliveryMethod === "delivery" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${deliveryMethod === "delivery" ? "text-blue-900" : "text-slate-700"}`}>Delivery</h3>
                    <p className="text-xs text-slate-500">Diantar ke lokasi Anda</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Content based on Delivery Method */}
            {deliveryMethod === "pickup" && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Lokasi Stand</h4>
                  <p className="text-sm text-slate-600">Stand FMIPA, Gedung A Lt.1, Universitas Udayana</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Pilih Jam Pengambilan</h4>
                  <select
                    className="w-full md:w-1/2 border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    <option value="" disabled>-- Pilih Jam --</option>
                    <option value="09:00 - 11:00">09:00 - 11:00 WITA</option>
                    <option value="12:00 - 14:00">12:00 - 14:00 WITA</option>
                    <option value="15:00 - 17:00">15:00 - 17:00 WITA</option>
                  </select>
                  {deliveryMethod === "pickup" && pickupTime === "" && (
                    <p className="text-red-500 text-xs mt-1.5">* Wajib memilih jam pengambilan</p>
                  )}
                </div>
              </div>
            )}

            {deliveryMethod === "delivery" && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                {hasSavedAddress ? (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">Alamat Pengiriman</h4>
                      <button
                        className="text-xs text-blue-600 font-semibold hover:underline"
                        onClick={() => setHasSavedAddress(false)}
                      >
                        Ganti / Tambah Baru
                      </button>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-3">
                      <p className="font-bold text-sm text-slate-800">Kos Putra Jaya</p>
                      <p className="text-xs text-slate-500 mt-1">Jalan Raya Kampus Unud, Jimbaran. Kamar No. 12 (Pagar Hitam)</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">Tambah Alamat Baru</h4>
                      <button
                        className="text-xs text-blue-600 font-semibold hover:underline"
                        onClick={() => setHasSavedAddress(true)}
                      >
                        Gunakan Alamat Tersimpan
                      </button>
                    </div>
                    <div className="space-y-3">
                      {/* Gunakan Lokasi Saat Ini Button */}
                      <button
                        onClick={handleCurrentLocation}
                        disabled={isDetectingLocation}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-slate-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isDetectingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mendeteksi lokasi...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4" />
                            Gunakan Lokasi Saat Ini
                          </>
                        )}
                      </button>

                      {/* Atau Divider */}
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-[1px] bg-slate-200 flex-1"></div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Atau</span>
                        <div className="h-[1px] bg-slate-200 flex-1"></div>
                      </div>

                      {/* Input Cari Alamat Peta */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Cari alamat menggunakan peta..."
                        />
                      </div>

                      {/* Peta Google Maps Mockup */}
                      <div className="w-full h-40 md:h-48 bg-slate-100 rounded-xl border border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
                        <Map className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-xs font-medium px-4 text-center">Peta Google Maps akan dirender di sini</span>

                        {/* Dummy map elements for visuals */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <div className="w-6 h-6 bg-white rounded shadow flex items-center justify-center text-[10px] font-bold text-slate-500">+</div>
                          <div className="w-6 h-6 bg-white rounded shadow flex items-center justify-center text-[10px] font-bold text-slate-500">-</div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1 mt-2">Nama Tempat (Opsional)</label>
                        <input type="text" placeholder="Contoh: Kos Putra Jaya" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Detail Alamat Lengkap *</label>
                        <textarea
                          placeholder="Nama jalan, nomor rumah/kamar, patokan..."
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20"
                          value={newAddressDetail}
                          onChange={(e) => setNewAddressDetail(e.target.value)}
                        />
                        {deliveryMethod === "delivery" && !hasSavedAddress && newAddressDetail.trim() === "" && (
                          <p className="text-red-500 text-xs mt-1.5">* Detail alamat lengkap wajib diisi untuk pengiriman</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Rincian Produk */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Rincian Produk ({checkoutItems.length} Item)
            </h2>

            <div className="space-y-4">
              {checkoutItems.map((item, index) => {
                const product = item.produk;
                const orgName = product.sub_toko?.toko?.organisasi?.nama_organisasi ?? "Organisasi";

                return (
                  <div key={index} className="flex gap-4 items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden flex-none">
                      {product.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.foto} alt={product.nama_produk} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{product.nama_produk}</h3>
                      <p className="text-xs text-slate-500 mb-1">{orgName}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {item.jumlah} x Rp {Number(product.harga).toLocaleString("id-ID")}
                        </span>
                        <span className="font-bold text-blue-600">
                          Rp {(Number(product.harga) * item.jumlah).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rincian Subtotal & Biaya */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-slate-800">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Layanan</span>
                <span className="font-semibold text-slate-800">Rp {platformFee.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Metode Pembayaran
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => handlePaymentSelect("qris")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${paymentMethod === "qris" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                  }`}
              >
                <QrCode className={`w-6 h-6 ${paymentMethod === "qris" ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold ${paymentMethod === "qris" ? "text-blue-900" : "text-slate-600"}`}>QRIS</span>
              </div>

              <div
                onClick={() => handlePaymentSelect("transfer")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${paymentMethod === "transfer" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                  }`}
              >
                <CreditCard className={`w-6 h-6 ${paymentMethod === "transfer" ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold ${paymentMethod === "transfer" ? "text-blue-900" : "text-slate-600"}`}>Transfer Bank</span>
              </div>

              <div
                onClick={() => handlePaymentSelect("cod")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${paymentMethod === "cod" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                  }`}
              >
                <Wallet className={`w-6 h-6 ${paymentMethod === "cod" ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold ${paymentMethod === "cod" ? "text-blue-900" : "text-slate-600"}`}>COD (Tunai)</span>
              </div>
            </div>

            {showPaymentAlert && (
              <div className="text-red-500 text-sm mt-3 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Tolong pilih metode pengambilan terlebih dahulu.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 mb-0.5">Total Pembayaran</p>
            <p className="text-xl font-extrabold text-blue-600">Rp {grandTotal.toLocaleString("id-ID")}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={!deliveryMethod || !paymentMethod}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${(!deliveryMethod || !paymentMethod)
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-md"
              }`}
          >
            Buat Pesanan
          </button>
        </div>
      </div>

      {/* TOAST: COD Success */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">Pesanan COD berhasil dibuat! Mengalihkan...</span>
        </div>
      )}

    </div>
  );
}
