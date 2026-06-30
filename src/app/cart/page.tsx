/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  Ticket,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import {
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  removeMultipleFromCart,
  type CartItem,
} from "@/lib/supabase/queries/cart";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleSelectItem = (id: string) => {
    setSelectedItems(
      (prev) =>
        prev.includes(id)
          ? prev.filter((itemId) => itemId !== id) // Hapus centang
          : [...prev, id], // Tambah centang
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]); // Uncheck all
    } else {
      setSelectedItems(cartItems.map((item) => item.id_keranjang)); // Check all
    }
  };

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
      console.error("[CartPage - fetchVouchers] Error:", error.message);
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
        // If claimed but not used, apply it directly
        setAppliedVoucher(claimCheck.voucher || voucherData);
        toast.success("Voucher berhasil diterapkan!");
        setVoucherCodeInput("");
        setIsVoucherModalOpen(false);
        return;
      }

      // If not claimed, claim it first
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

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Pilih minimal 1 barang untuk di-checkout!");
      return;
    }
    // Ambil detail barang yang dicentang saja
    const selectedCartItems = cartItems.filter((item) =>
      selectedItems.includes(item.id_keranjang),
    );

    // Simpan ke localStorage agar bisa dipanggil di halaman /checkout
    localStorage.setItem("checkoutItems", JSON.stringify(selectedCartItems));
    if (appliedVoucher) {
      localStorage.setItem("checkoutVoucher", JSON.stringify(appliedVoucher));
    } else {
      localStorage.removeItem("checkoutVoucher");
    }
    router.push("/checkout");
  };

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    const items = await getCartItems();
    setCartItems(items);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchCart();
      fetchVouchers();
      const savedVoucher = localStorage.getItem("checkoutVoucher");
      if (savedVoucher) {
        try {
          setAppliedVoucher(JSON.parse(savedVoucher));
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {}
      }
    });
  }, [fetchCart, fetchVouchers]);

  const handleUpdateQuantity = async (cartId: string, newQuantity: number) => {
    // Optimistic UI update
    setCartItems((prev) =>
      prev.map((item) =>
        item.id_keranjang === cartId ? { ...item, jumlah: newQuantity } : item,
      ),
    );

    setUpdatingIds((prev) => new Set(prev).add(cartId));

    const result = await updateCartItemQuantity(cartId, newQuantity);

    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.delete(cartId);
      return next;
    });

    if (!result.success) {
      // Revert on error
      fetchCart();
      console.error("[CartPage - updateQuantity] Error:", result.error);
    }
  };

  const handleRemoveItem = async (cartId: string) => {
    setIsDeleting(true);
    const result = await removeFromCart(cartId);
    setIsDeleting(false);
    setShowDeleteModal(false);
    setItemToDelete(null);

    if (result.success) {
      setCartItems((prev) =>
        prev.filter((item) => item.id_keranjang !== cartId),
      );
      window.dispatchEvent(new Event("cart-updated"));
    } else {
      console.error("[CartPage - removeItem] Error:", result.error);
      alert("Gagal menghapus barang.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);

    const result = await removeMultipleFromCart(selectedItems);

    setIsDeleting(false);
    setShowDeleteModal(false);
    setItemToDelete(null);

    if (result.success) {
      setCartItems((prev) =>
        prev.filter((item) => !selectedItems.includes(item.id_keranjang)),
      );
      setSelectedItems([]);
      window.dispatchEvent(new Event("cart-updated"));
    } else {
      console.error("[CartPage - deleteSelected] Error:", result.error);
      alert("Gagal menghapus barang terpilih.");
    }
  };

  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.includes(item.id_keranjang),
  );

  const totalItems = selectedCartItems.reduce(
    (acc, item) => acc + item.jumlah,
    0,
  );
  const subtotal = selectedCartItems.reduce(
    (acc, item) => acc + Number(item.produk.harga) * item.jumlah,
    0,
  );
  // Hitung diskon secara dinamis
  let discount = 0;
  let voucherError = "";
  if (appliedVoucher) {
    const isMinBelanjaMet =
      !appliedVoucher.min_belanja ||
      subtotal >= Number(appliedVoucher.min_belanja);
    const cartTokoIds = selectedCartItems.map(
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

  if (isLoading) {
    return (
      <div className="min-h-screen pb-12 bg-slate-50">
        <div className="max-w-5xl px-4 py-6 mx-auto md:px-8 md:py-10">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/explore"
              className="flex items-center justify-center w-10 h-10 transition bg-white border rounded-full shadow-sm text-slate-600 border-slate-200 hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Keranjang Belanja
            </h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      <div className="max-w-5xl px-4 py-6 mx-auto md:px-8 md:py-10">
        {/* Header & Tombol Kembali */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/explore"
            className="flex items-center justify-center w-10 h-10 transition bg-white border rounded-full shadow-sm text-slate-600 border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Keranjang Belanja
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white border shadow-sm rounded-2xl border-slate-200">
            <div className="flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-slate-100">
              <ShoppingBag className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">
              Keranjangmu masih kosong
            </h2>
            <p className="max-w-sm mb-6 text-slate-500">
              Yuk, mulai eksplorasi berbagai produk dan kegiatan proker kampus
              yang menarik!
            </p>
            <Link
              href="/explore"
              className="px-6 py-3 font-bold text-white transition bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Mulai Eksplorasi
            </Link>
          </div>
        ) : (
          /* ===== LAYOUT UTAMA ===== */
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
            {/* KOLOM KIRI: Daftar Produk (Lebar 2/3 di layar besar) */}
            <div className="w-full space-y-4 lg:w-2/3">
              <div className="flex items-center justify-between p-4 bg-white border shadow-sm rounded-2xl border-slate-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === cartItems.length &&
                      cartItems.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer accent-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Pilih Semua Barang
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => {
                      setItemToDelete("MULTIPLE");
                      setShowDeleteModal(true);
                    }}
                    className="text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Terpilih ({selectedItems.length})</span>
                  </button>
                )}
              </div>
              {cartItems.map((item) => {
                const product = item.produk;
                const orgName =
                  product.sub_toko?.toko?.organisasi?.nama_organisasi ??
                  "Organisasi";
                const prokerName = product.sub_toko?.nama_proker ?? "Proker";

                return (
                  <div
                    key={item.id_keranjang}
                    className="flex items-center gap-4 p-4 bg-white border shadow-sm rounded-2xl border-slate-200 sm:p-5 sm:gap-6"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id_keranjang)}
                      onChange={() => handleSelectItem(item.id_keranjang)}
                      className="flex-none w-5 h-5 text-blue-600 rounded cursor-pointer accent-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    {/* Gambar Produk */}
                    <div className="relative flex items-center justify-center flex-none w-24 h-24 overflow-hidden border sm:w-28 sm:h-28 bg-slate-50 border-slate-200 rounded-xl">
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

                    {/* Detail Produk */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md mb-2 inline-block">
                          {orgName} — {prokerName}
                        </span>
                        <h3 className="mb-1 text-base font-bold leading-tight truncate sm:text-lg text-slate-900">
                          {product.nama_produk}
                        </h3>
                        <p className="text-sm font-bold text-blue-600">
                          Rp {Number(product.harga).toLocaleString("id-ID")}
                        </p>
                      </div>

                      {/* Aksi: Hapus & Kuantitas */}
                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => {
                            setItemToDelete(item.id_keranjang);
                            setShowDeleteModal(true);
                          }}
                          className="text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition p-1.5 -ml-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>

                        <div className="flex items-center flex-none overflow-hidden border rounded-lg border-slate-300">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.id_keranjang,
                                Math.max(1, item.jumlah - 1),
                              )
                            }
                            disabled={updatingIds.has(item.id_keranjang)}
                            className="flex items-center justify-center w-8 h-8 font-bold transition text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            −
                          </button>
                          <span className="w-10 text-sm font-semibold text-center text-slate-800">
                            {updatingIds.has(item.id_keranjang) ? (
                              <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                            ) : (
                              item.jumlah
                            )}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.id_keranjang,
                                Math.min(product.stok, item.jumlah + 1),
                              )
                            }
                            disabled={updatingIds.has(item.id_keranjang)}
                            className="flex items-center justify-center w-8 h-8 font-bold transition text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* KOLOM KANAN: Ringkasan Belanja (Lebar 1/3 di layar besar) */}
            <div className="flex-none w-full lg:w-1/3">
              <div className="sticky p-6 bg-white border shadow-sm rounded-2xl border-slate-200 top-6">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Ringkasan Belanja
                </h3>

                <div className="mb-4 space-y-3 text-sm border-b pb-4 border-slate-100">
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
                  {appliedVoucher && !voucherError && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>
                        Diskon Voucher ({appliedVoucher.kode_voucher})
                      </span>
                      <span>-Rp {discount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>

                {/* Promo/Voucher */}
                <div
                  onClick={() => setIsVoucherModalOpen(true)}
                  className={`flex items-center justify-between p-3 mb-4 transition border rounded-xl hover:bg-blue-50 cursor-pointer ${
                    appliedVoucher
                      ? voucherError
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold min-w-0 flex-1 mr-2">
                    <Ticket className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {appliedVoucher
                        ? voucherError
                          ? `${appliedVoucher.kode_voucher} (${voucherError})`
                          : `Terpakai: ${appliedVoucher.kode_voucher}`
                        : "Pakai Promo / Voucher"}
                    </span>
                  </div>
                  {appliedVoucher ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAppliedVoucher(null);
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded px-1.5 py-0.5 shrink-0"
                    >
                      Batal
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-blue-500 shrink-0">
                      Pilih &gt;
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between mb-6">
                  <span className="font-bold text-slate-900">
                    Total Tagihan
                  </span>
                  <span className="text-xl font-extrabold text-blue-600">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed! transition shadow-sm mb-3 disabled:opacity-50"
                >
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overscroll-none">
          <div className="w-full max-w-sm p-6 bg-white shadow-xl rounded-2xl animate-in zoom-in-95">
            <h3 className="mb-2 text-xl font-bold text-slate-900">
              Hapus Barang?
            </h3>
            <p className="mb-6 text-sm text-slate-500">
              Apakah kamu yakin ingin menghapus{" "}
              {itemToDelete === "MULTIPLE" ? selectedItems.length : 1} barang
              dari keranjang?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (itemToDelete === "MULTIPLE") {
                    handleDeleteSelected();
                  } else if (itemToDelete) {
                    handleRemoveItem(itemToDelete);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
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
                  const cartTokoIds = selectedCartItems.map(
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
