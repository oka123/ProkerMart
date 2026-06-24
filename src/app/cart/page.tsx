"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  Ticket,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  removeMultipleFromCart,
  type CartItem,
} from "@/lib/supabase/queries/cart";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    router.push("/checkout");
  };

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    const items = await getCartItems();
    setCartItems(items);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

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
  const platformFee = 2000;
  const grandTotal = subtotal > 0 ? subtotal + platformFee : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

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
          /* ===== LAYOUT UTAMA ===== */
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* KOLOM KIRI: Daftar Produk (Lebar 2/3 di layar besar) */}
            <div className="w-full lg:w-2/3 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === cartItems.length &&
                      cartItems.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-blue-600 accent-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
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
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex gap-4 sm:gap-6 items-center"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id_keranjang)}
                      onChange={() => handleSelectItem(item.id_keranjang)}
                      className="w-5 h-5 text-blue-600 accent-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer flex-none"
                    />
                    {/* Gambar Produk */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center flex-none overflow-hidden">
                      {product.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.foto}
                          alt={product.nama_produk}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      )}
                    </div>

                    {/* Detail Produk */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md mb-2 inline-block">
                          {orgName} — {prokerName}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mb-1 truncate">
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

                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden flex-none">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.id_keranjang,
                                Math.max(1, item.jumlah - 1),
                              )
                            }
                            disabled={updatingIds.has(item.id_keranjang)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold disabled:opacity-50"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-semibold text-slate-800 text-sm">
                            {updatingIds.has(item.id_keranjang) ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
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
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold disabled:opacity-50"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Hapus Barang?
            </h3>
            <p className="text-slate-500 text-sm mb-6">
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
    </div>
  );
}
