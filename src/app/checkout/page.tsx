/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Pencil,
  Ticket,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

function CheckoutContent() {
  const router = useRouter();
  const supabase = createClient();

  // States for Notifications/Modals
  const [showToast, setShowToast] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  const [itemMethods, setItemMethods] = useState<
    Record<string, "pickup" | "delivery">
  >({});
  const [paymentMethod, setPaymentMethod] = useState<
    "qris" | "transfer" | "cod" | null
  >(null);

  // Derived states
  const hasDelivery = Object.values(itemMethods).includes("delivery");
  const hasPickup = Object.values(itemMethods).includes("pickup");

  // Real Address States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Pick Up States
  const [itemPickupTimes, setItemPickupTimes] = useState<
    Record<string, string>
  >({});
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);

  const searchParams = useSearchParams();
  const jalur = searchParams.get("jalur");

  // Load Saved Addresses
  const fetchAddresses = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.nama || "Pembeli");

      const { data: addrList, error } = await supabase
        .from("alamat_pembeli")
        .select("*")
        .eq("id_pengguna", user.id)
        .order("is_utama", { ascending: false });

      if (error) throw error;

      if (addrList && addrList.length > 0) {
        setAddresses(addrList);
        const primary = addrList.find((a) => a.is_utama) || addrList[0];
        setSelectedAddressId(primary.id_alamat);
      }
    } catch (err) {
      console.error("Gagal memuat alamat:", err);
    }
  }, [supabase]);

  useEffect(() => {
    const initAddresses = async () => {
      await Promise.resolve(); // Menghindari error set-state-in-effect
      await fetchAddresses();
    };
    initAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchVouchers = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("voucher_pengguna")
        .select(
          `
          status_pakai,
          voucher (*)
        `,
        )
        .eq("id_pengguna", user.id)
        .eq("status_pakai", false);

      if (error) throw error;
      setVouchers(data || []);
    } catch (error: any) {
      console.error("[CheckoutPage - fetchVouchers] Error:", error.message);
    }
  }, [supabase]);

  const handleClaimAndApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      toast.error("Masukkan kode voucher terlebih dahulu!");
      return;
    }
    setIsValidatingVoucher(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu.");
        return;
      }

      // Check if voucher exists and is active & not expired
      const { data: voucherData, error: voucherErr } = await supabase
        .from("voucher")
        .select("*")
        .ilike("kode_voucher", voucherCodeInput.trim())
        .single();

      if (voucherErr || !voucherData) {
        throw new Error("Voucher tidak ditemukan.");
      }
      if (!voucherData.status) {
        throw new Error("Voucher tidak aktif.");
      }
      if (new Date(voucherData.tgl_berakhir) < new Date()) {
        throw new Error("Voucher sudah kedaluwarsa.");
      }
      if (voucherData.kuota !== null && voucherData.kuota <= 0) {
        throw new Error("Kuota voucher sudah habis.");
      }

      // Check if user already claimed this voucher
      const { data: claimCheck } = await supabase
        .from("voucher_pengguna")
        .select("*")
        .eq("id_pengguna", user.id)
        .eq("id_voucher", voucherData.id_voucher)
        .maybeSingle();

      if (claimCheck) {
        if (claimCheck.status_pakai) {
          throw new Error("Voucher ini sudah Anda gunakan.");
        }
        setAppliedVoucher(claimCheck.voucher || voucherData);
        toast.success("Voucher berhasil diterapkan!");
        setVoucherCodeInput("");
        setIsVoucherModalOpen(false);
        return;
      }

      // Claim it
      const { error: claimErr } = await supabase
        .from("voucher_pengguna")
        .insert({
          id_pengguna: user.id,
          id_voucher: voucherData.id_voucher,
          status_pakai: false,
          tgl_klaim: new Date().toISOString(),
        });

      if (claimErr) throw claimErr;

      setAppliedVoucher(voucherData);
      toast.success("Voucher berhasil diklaim dan diterapkan!");
      setVoucherCodeInput("");
      fetchVouchers();
      setIsVoucherModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menerapkan voucher.");
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  // Product Data based on jalur
  useEffect(() => {
    const initItems = async () => {
      await Promise.resolve(); // Menghindari pemanggilan setState secara sinkron

      let parsed: any[] = [];
      if (jalur === "langsung") {
        const savedItem = sessionStorage.getItem("directCheckoutItem");
        if (savedItem) {
          parsed = JSON.parse(savedItem);
        }
      } else {
        const savedItems = localStorage.getItem("checkoutItems");
        if (savedItems) {
          parsed = JSON.parse(savedItems);
        }
      }

      if (parsed.length > 0) {
        setCheckoutItems(parsed);

        // Calculate initial itemMethods
        const initial: Record<string, "pickup" | "delivery"> = {};
        parsed.forEach((item) => {
          const prod = item.produk || item;
          const id = prod.id_produk;
          const saleMethod = prod.metode_jualan || "";
          if (saleMethod === "delivery") {
            initial[id] = "delivery";
          } else if (saleMethod === "pickup") {
            initial[id] = "pickup";
          } else {
            initial[id] = "pickup";
          }
        });
        setItemMethods(initial);
      }

      fetchVouchers();
      const savedVoucher = localStorage.getItem("checkoutVoucher");
      if (savedVoucher) {
        try {
          setAppliedVoucher(JSON.parse(savedVoucher));
        } catch {}
      }
    };

    initItems();
  }, [jalur, fetchVouchers]);

  // Menghitung subtotal dari seluruh barang yang ada di checkoutItems
  const subtotal = checkoutItems.reduce(
    (acc, item) =>
      acc + Number(item.produk?.harga ?? item.harga ?? 0) * item.jumlah,
    0,
  );

  // Hitung diskon secara dinamis
  let discount = 0;
  let voucherError = "";
  if (appliedVoucher) {
    const isMinBelanjaMet =
      !appliedVoucher.min_belanja ||
      subtotal >= Number(appliedVoucher.min_belanja);
    const cartTokoIds = checkoutItems.map(
      (item) => item.produk?.sub_toko?.toko?.id_toko,
    );
    const isTokoMet =
      !appliedVoucher.id_toko || cartTokoIds.includes(appliedVoucher.id_toko);

    if (!isMinBelanjaMet) {
      voucherError = `Min. belanja Rp ${Number(appliedVoucher.min_belanja).toLocaleString("id-ID")} tidak terpenuhi`;
    } else if (!isTokoMet) {
      voucherError = `Hanya berlaku di toko tertentu`;
    } else {
      if (appliedVoucher.tipe_diskon === "persen") {
        discount = (subtotal * Number(appliedVoucher.nilai_diskon)) / 100;
        if (
          appliedVoucher.max_diskon &&
          discount > Number(appliedVoucher.max_diskon)
        ) {
          discount = Number(appliedVoucher.max_diskon);
        }
      } else if (appliedVoucher.tipe_diskon === "nominal") {
        discount = Number(appliedVoucher.nilai_diskon);
      }
      if (discount > subtotal) {
        discount = subtotal;
      }
    }
  }

  const platformFee = 2000;
  const grandTotal =
    subtotal > 0 ? Math.max(0, subtotal + platformFee - discount) : 0;

  const handlePaymentSelect = (method: "qris" | "transfer" | "cod") => {
    if (Object.keys(itemMethods).length === 0) {
      setShowPaymentAlert(true);
      return;
    }
    setShowPaymentAlert(false);
    setPaymentMethod(method);
  };

  const handleCheckout = async () => {
    if (Object.keys(itemMethods).length === 0 || !paymentMethod) return;

    let alamatLengkapText = "";

    if (hasDelivery) {
      const selectedAddr = addresses.find(
        (a) => a.id_alamat === selectedAddressId,
      );
      if (!selectedAddr) {
        toast.error("Pilih alamat pengiriman terlebih dahulu!");
        return;
      }
      alamatLengkapText = `${selectedAddr.nama_penerima} (${selectedAddr.no_telepon}), ${selectedAddr.detail_jalan}, Kec. ${selectedAddr.kecamatan}, ${selectedAddr.kota}, ${selectedAddr.provinsi} ${selectedAddr.kode_pos}`;
    }

    // Map items to include their chosen method and pickup time
    const itemsWithMethods = checkoutItems.map((item) => {
      const prod = item.produk || item;
      const method = itemMethods[prod.id_produk] || "pickup";
      const pickupTimeVal = itemPickupTimes[prod.id_produk] || "";

      return {
        ...item,
        metode_pengambilan: method,
        tgl_ambil: method === "pickup" ? pickupTimeVal : null,
      };
    });

    if (hasPickup) {
      const missingPickupTime = itemsWithMethods.some(
        (item) => item.metode_pengambilan === "pickup" && !item.tgl_ambil,
      );
      if (missingPickupTime) {
        alert(
          "Pilih jam pengambilan terlebih dahulu untuk semua produk pick up!",
        );
        return;
      }
    }

    try {
      setIsSavingAddress(true); // Re-use state loader
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_harga: Math.round(grandTotal),
          nama_kustomer: userName,
          email_kustomer: userEmail,
          items: itemsWithMethods,
          metode_pengambilan:
            hasPickup && hasDelivery
              ? "mixed"
              : hasDelivery
                ? "delivery"
                : "pickup",
          metode_pembayaran: paymentMethod,
          jalur_checkout: jalur === "langsung" ? "langsung" : "keranjang",
          alamat_pengambilan: hasDelivery ? alamatLengkapText : null,
          tgl_ambil: null,
          id_voucher: appliedVoucher?.id_voucher || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses pesanan");
      }

      if (data.isCod) {
        localStorage.removeItem("checkoutItems");
        localStorage.removeItem("checkoutVoucher");
        sessionStorage.removeItem("directCheckoutItem");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          router.replace("/user/purchase");
        }, 2000);
      } else if (data.token) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log("Berhasil!", result);
            localStorage.removeItem("checkoutItems");
            localStorage.removeItem("checkoutVoucher");
            sessionStorage.removeItem("directCheckoutItem");
            router.replace("/user/purchase");
          },
          onPending: function (result: any) {
            console.log("Menunggu pembayaran!", result);
            localStorage.removeItem("checkoutItems");
            localStorage.removeItem("checkoutVoucher");
            sessionStorage.removeItem("directCheckoutItem");
            router.replace("/user/purchase");
          },
          onError: function (result: any) {
            console.log("Gagal!", result);
            alert("Pembayaran gagal diproses. Silakan coba lagi.");
          },
          onClose: function () {
            console.log("Pop-up ditutup tanpa menyelesaikan pembayaran");
          },
        });
      } else {
        alert("Gagal mendapatkan token dari server. Silakan coba lagi.");
      }
    } catch (error: any) {
      console.error("Terjadi kesalahan saat memanggil API Midtrans:", error);
      alert(
        error.message ||
          "Terjadi kesalahan sistem. Pastikan server API berjalan.",
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <Navbar />

      <div className="max-w-3xl px-4 py-6 mx-auto md:px-8 md:py-10">
        {/* Tombol Kembali */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-sm font-medium transition text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <h1 className="mb-8 text-2xl font-bold text-slate-900">
          Checkout Pesanan
        </h1>

        <div className="space-y-6">
          {/* 1. Alamat & Pengambilan */}
          {(hasPickup || hasDelivery) && (
            <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
              <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-slate-800">
                <MapPin className="w-5 h-5 text-blue-600" />
                Informasi Pengambilan & Pengiriman
              </h2>

              <div className="space-y-6">
                {/* Delivery Form */}
                {hasDelivery && (
                  <div className="p-4 border bg-slate-50 rounded-xl border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Alamat Pengiriman
                      </h4>
                      <button
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        onClick={() =>
                          (window.location.href =
                            "/user/account/address?action=add&return_url=/checkout")
                        }
                      >
                        Tambah Alamat Baru
                      </button>
                    </div>

                    {addresses.length > 0 ? (
                      <div className="pr-1 space-y-2 overflow-y-auto max-h-60">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id_alamat}
                            className={`bg-white border rounded-lg p-3 text-left transition-all relative ${
                              selectedAddressId === addr.id_alamat
                                ? "border-blue-600 ring-2 ring-blue-100"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() =>
                                setSelectedAddressId(addr.id_alamat)
                              }
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                  {addr.nama_penerima}
                                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {addr.tipe_alamat}
                                  </span>
                                  {addr.is_utama && (
                                    <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-semibold">
                                      Utama
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span className="block mb-1 text-xs text-slate-500">
                                {addr.no_telepon}
                              </span>
                              <p className="pr-8 text-xs text-slate-600">
                                {addr.detail_jalan}, Kec. {addr.kecamatan},{" "}
                                {addr.kota}, {addr.provinsi} {addr.kode_pos}
                              </p>
                              {addr.catatan_tambahan && (
                                <p className="text-[11px] text-slate-400 mt-1 italic">
                                  Catatan: {addr.catatan_tambahan}
                                </p>
                              )}
                            </div>
                            {/* Edit Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/user/account/address?action=edit&id=${addr.id_alamat}&return_url=/checkout`;
                              }}
                              className="absolute p-1 transition-colors bg-white rounded top-3 right-3 text-slate-400 hover:text-blue-600"
                              title="Ubah Alamat"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center bg-white border border-dashed rounded-lg border-slate-200">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="mb-4 text-sm text-slate-500">
                          Belum ada alamat tersimpan.
                        </p>
                        <button
                          onClick={() =>
                            (window.location.href =
                              "/user/account/address?action=add&return_url=/checkout")
                          }
                          className="inline-block px-4 py-2 text-sm font-semibold text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
                        >
                          Tambah Alamat Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Rincian Produk */}
          <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-slate-800">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Rincian Produk ({checkoutItems.length} Item)
            </h2>

            <div className="space-y-4">
              {checkoutItems.map((item, index) => {
                const product = item.produk;
                const orgName =
                  product.sub_toko?.toko?.organisasi?.nama_organisasi ??
                  "Organisasi";
                const current = itemMethods[product.id_produk] || "pickup";

                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="relative flex items-center justify-center flex-none w-16 h-16 overflow-hidden border sm:w-20 sm:h-20 bg-slate-50 rounded-xl border-slate-200">
                      {product.foto ? (
                        <Image
                          src={product.foto}
                          alt={product.nama_produk}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold truncate text-slate-800">
                            {product.nama_produk}
                          </h3>
                          <p className="mb-1 text-xs text-slate-500">
                            {orgName}
                          </p>
                        </div>

                        {/* Per-Item Delivery Selection */}
                        <div className="flex-none">
                          {(() => {
                            const methodStr = product.metode_jualan || "";
                            const supportsPickup =
                              methodStr === "pickup" ||
                              methodStr === "pickup,delivery" ||
                              methodStr === "delivery,pickup" ||
                              !methodStr;
                            const supportsDelivery =
                              methodStr === "delivery" ||
                              methodStr === "pickup,delivery" ||
                              methodStr === "delivery,pickup";
                            const hasBoth = supportsPickup && supportsDelivery;

                            if (hasBoth) {
                              return (
                                <div className="inline-flex border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                                  <button
                                    onClick={() =>
                                      setItemMethods((prev) => ({
                                        ...prev,
                                        [product.id_produk]: "pickup",
                                      }))
                                    }
                                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                                      current === "pickup"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    Pick Up
                                  </button>
                                  <button
                                    onClick={() =>
                                      setItemMethods((prev) => ({
                                        ...prev,
                                        [product.id_produk]: "delivery",
                                      }))
                                    }
                                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                                      current === "delivery"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    Delivery
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <span className="inline-block px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg">
                                  {supportsDelivery ? "Delivery" : "Pick Up"}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {item.jumlah} x Rp{" "}
                          {Number(product.harga).toLocaleString("id-ID")}
                        </span>
                        <span className="font-bold text-blue-600">
                          Rp{" "}
                          {(Number(product.harga) * item.jumlah).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      </div>

                      {/* Per-Item Pickup Settings Box */}
                      {current === "pickup" && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-3">
                          <div className="flex-1">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Lokasi Stand
                            </span>
                            <span className="text-xs text-slate-700">
                              {product.sub_toko?.alamat ||
                                `Stand ${product.sub_toko?.nama_proker || "FMIPA"}, Gedung A Lt.1`}
                            </span>
                          </div>
                          <div className="flex-1">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Pilih Jam Ambil
                            </span>
                            <select
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={itemPickupTimes[product.id_produk] || ""}
                              onChange={(e) =>
                                setItemPickupTimes((prev) => ({
                                  ...prev,
                                  [product.id_produk]: e.target.value,
                                }))
                              }
                            >
                              <option value="" disabled>
                                -- Jam Ambil --
                              </option>
                              <option value="09:00 - 11:00">
                                09:00 - 11:00 WITA
                              </option>
                              <option value="12:00 - 14:00">
                                12:00 - 14:00 WITA
                              </option>
                              <option value="15:00 - 17:00">
                                15:00 - 17:00 WITA
                              </option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rincian Subtotal & Biaya */}
            <div className="pt-4 mt-4 space-y-2 text-sm border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-slate-800">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              {appliedVoucher && !voucherError && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Diskon Voucher ({appliedVoucher.kode_voucher})</span>
                  <span>-Rp {discount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Biaya Layanan</span>
                <span className="font-semibold text-slate-800">
                  Rp {platformFee.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Promo / Voucher */}
          <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-slate-800">
              <Ticket className="w-5 h-5 text-blue-600" />
              Promo / Voucher
            </h2>
            <div
              onClick={() => setIsVoucherModalOpen(true)}
              className={`flex items-center justify-between p-3.5 transition border rounded-xl hover:bg-blue-50 cursor-pointer ${
                appliedVoucher
                  ? voucherError
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <div className="flex items-center gap-2.5 text-sm font-semibold min-w-0 flex-1 mr-2">
                <Ticket className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate text-sm">
                  {appliedVoucher
                    ? voucherError
                      ? `${appliedVoucher.kode_voucher} (${voucherError})`
                      : `Terpakai: ${appliedVoucher.nama_voucher} (${appliedVoucher.kode_voucher})`
                    : "Pakai Promo / Voucher"}
                </span>
              </div>
              {appliedVoucher ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAppliedVoucher(null);
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 shrink-0 transition-colors"
                >
                  Batal
                </button>
              ) : (
                <span className="text-xs font-bold text-blue-500 shrink-0">
                  Pilih &gt;
                </span>
              )}
            </div>
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-slate-800">
              <Wallet className="w-5 h-5 text-blue-600" />
              Metode Pembayaran
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div
                onClick={() => handlePaymentSelect("qris")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "qris"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <QrCode
                  className={`w-6 h-6 ${paymentMethod === "qris" ? "text-blue-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-sm font-semibold ${paymentMethod === "qris" ? "text-blue-900" : "text-slate-600"}`}
                >
                  QRIS
                </span>
              </div>

              <div
                onClick={() => handlePaymentSelect("transfer")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "transfer"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <CreditCard
                  className={`w-6 h-6 ${paymentMethod === "transfer" ? "text-blue-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-sm font-semibold ${paymentMethod === "transfer" ? "text-blue-900" : "text-slate-600"}`}
                >
                  Transfer Bank
                </span>
              </div>

              <div
                onClick={() => handlePaymentSelect("cod")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "cod"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <Wallet
                  className={`w-6 h-6 ${paymentMethod === "cod" ? "text-blue-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-sm font-semibold ${paymentMethod === "cod" ? "text-blue-900" : "text-slate-600"}`}
                >
                  COD (Tunai)
                </span>
              </div>
            </div>

            {showPaymentAlert && (
              <div className="flex items-center gap-1 mt-3 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" /> Tolong pilih metode
                pengambilan terlebih dahulu.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <p className="text-sm text-slate-500 mb-0.5">Total Pembayaran</p>
            <p className="text-xl font-extrabold text-blue-600">
              Rp {grandTotal.toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={
              Object.keys(itemMethods).length === 0 ||
              !paymentMethod ||
              isSavingAddress
            }
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
              Object.keys(itemMethods).length === 0 ||
              !paymentMethod ||
              isSavingAddress
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-md"
            }`}
          >
            {isSavingAddress ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </span>
            ) : (
              "Buat Pesanan"
            )}
          </button>
        </div>
      </div>

      {/* TOAST: COD Success */}
      {showToast && (
        <div className="fixed z-50 flex items-center gap-3 px-5 py-4 text-white -translate-x-1/2 shadow-2xl top-24 left-1/2 bg-slate-900 rounded-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">
            Pesanan COD berhasil dibuat! Mengalihkan...
          </span>
        </div>
      )}
      {/* Voucher Modal */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overscroll-none">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Pilih Promo / Voucher
              </h3>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Voucher Code */}
            <div className="py-4 border-b border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Masukkan Kode Promo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: HEMAT5K"
                  value={voucherCodeInput}
                  onChange={(e) =>
                    setVoucherCodeInput(e.target.value.toUpperCase())
                  }
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleClaimAndApplyVoucher}
                  disabled={isValidatingVoucher}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center gap-1"
                >
                  {isValidatingVoucher ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Terapkan"
                  )}
                </button>
              </div>
            </div>

            {/* Voucher List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Voucher Saya
              </h4>
              {vouchers.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-xl border-slate-200">
                  <Ticket className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">
                    Kamu belum mengklaim voucher apa pun.
                  </p>
                </div>
              ) : (
                vouchers.map((item: any) => {
                  const v = item.voucher;
                  if (!v) return null;

                  const isMinBelanjaMet =
                    !v.min_belanja || subtotal >= Number(v.min_belanja);
                  const cartTokoIds = checkoutItems.map(
                    (item) => item.produk?.sub_toko?.toko?.id_toko,
                  );
                  const isTokoMet =
                    !v.id_toko || cartTokoIds.includes(v.id_toko);
                  const isValid = isMinBelanjaMet && isTokoMet;

                  return (
                    <div
                      key={v.id_voucher}
                      className={`p-4 border rounded-xl flex flex-col justify-between gap-3 transition text-left ${
                        appliedVoucher?.id_voucher === v.id_voucher
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-slate-200 hover:border-blue-300"
                      } ${!isValid ? "opacity-60 bg-slate-50" : ""}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 text-sm">
                              {v.nama_voucher}
                            </span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                              {v.kode_voucher}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {v.deskripsi}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 whitespace-nowrap">
                          {v.tipe_diskon === "persen"
                            ? `${v.nilai_diskon}% OFF`
                            : `Rp ${Number(v.nilai_diskon).toLocaleString("id-ID")} OFF`}
                        </span>
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <div>
                          {v.min_belanja && (
                            <p>
                              Min. Belanja: Rp{" "}
                              {Number(v.min_belanja).toLocaleString("id-ID")}
                            </p>
                          )}
                          {v.id_toko && (
                            <p className="text-blue-500">
                              Berlaku di toko tertentu saja
                            </p>
                          )}
                          <p>
                            Berakhir:{" "}
                            {new Date(v.tgl_berakhir).toLocaleDateString(
                              "id-ID",
                            )}
                          </p>
                        </div>

                        {appliedVoucher?.id_voucher === v.id_voucher ? (
                          <button
                            onClick={() => setAppliedVoucher(null)}
                            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition"
                          >
                            Batal
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (isValid) {
                                setAppliedVoucher(v);
                                setIsVoucherModalOpen(false);
                                toast.success(
                                  `Voucher ${v.kode_voucher} digunakan!`,
                                );
                              }
                            }}
                            disabled={!isValid}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              isValid
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {!isMinBelanjaMet
                              ? "Min. Belanja"
                              : !isTokoMet
                                ? "Toko Berbeda"
                                : "Gunakan"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
