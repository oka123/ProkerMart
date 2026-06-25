/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Package,
  CheckCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/supabase/queries/cart";
import Link from "next/link";

interface ProductActionsProps {
  product: any;
  productId: string;
  price: number;
  stock: number;
  productName: string;
  sellerName: string;
  sellerType: "organisasi" | "toko";
  subTokoId?: string;
}

export function ProductActions({
  product,
  productId,
  price,
  stock,
  productName,
  sellerName,
  sellerType,
  subTokoId,
}: ProductActionsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    // Check auth state on mount
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => setIsLoggedIn(!!user));
    });
  }, []);

  const totalPrice = price * quantity;

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    setIsAddingToCart(true);
    setNotificationError(null);

    const result = await addToCart(productId, quantity);

    setIsAddingToCart(false);

    if (result.success) {
      window.dispatchEvent(new Event("cart-updated"));
      setShowNotification(true);
      setNotificationError(null);
      setTimeout(() => setShowNotification(false), 3000);
    } else {
      setNotificationError(result.error ?? "Gagal menambahkan ke keranjang");
      setTimeout(() => setNotificationError(null), 4000);
    }
  };

  const handleChatSeller = () => {
    window.dispatchEvent(
      new CustomEvent("openProkerChat", {
        detail: {
          id_sub_toko: subTokoId,
          name: sellerName,
          type: sellerType,
        },
      }),
    );
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    // 1. Bungkus data produk persis seperti struktur tabel 'keranjang'
    const itemBeliLangsung = [
      {
        jumlah: quantity,      // Mengambil dari state quantity yang sudah Bli buat
        produk: product,       // Mengambil dari props product utuh
      }
    ];

    // 2. Simpan sementara di memori browser (sessionStorage)
    sessionStorage.setItem("directCheckoutItem", JSON.stringify(itemBeliLangsung));

    // 3. Pindah ke checkout dengan memberikan "Tanda Pengenal" jalur langsung
    router.push("/checkout?jalur=langsung");
  };

  return (
    <>
      <div className="flex flex-col gap-6 flex-1">
        {/* Quantity Selector */}
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
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg"
              >
                +
              </button>
            </div>
            <span className="text-sm text-slate-500">Maks. {stock} item</span>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-1">
          <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
            <span>Harga satuan</span>
            <span>Rp {price.toLocaleString("id-ID")}</span>
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

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 w-full">
          <button
            type="button"
            onClick={handleChatSeller}
            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-2.5 px-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="truncate">Chat</span>
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={stock === 0 || isAddingToCart}
            className="w-full bg-emerald-600 text-white font-bold py-2.5 px-3 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAddingToCart ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <ShoppingBag className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">
              {isAddingToCart ? "Menambahkan..." : "Keranjang"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={stock === 0}
            className="w-full bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer truncate"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Success Toast Notification */}
      {showNotification && (
        <Link href="/cart">
          <div className="fixed top-16 right-0 lg:right-8 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">
              {productName} berhasil ditambahkan ke keranjang!
            </span>
          </div>
        </Link>
      )}

      {/* Error Toast Notification */}
      {notificationError && (
        <div className="fixed bottom-8 right-8 z-50 bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <AlertCircle className="w-5 h-5 text-red-200" />
          <span className="font-semibold text-sm">{notificationError}</span>
        </div>
      )}
    </>
  );
}
