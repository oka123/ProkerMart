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
  Clock,
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
  const isPreorder: boolean = product?.preorder ?? false;
  const minOrder: number = isPreorder ? (product?.min_order ?? 1) : 1;
  const dpPersen: number = isPreorder ? (product?.dp_persen ?? 0) : 0;

  const [quantity, setQuantity] = useState(minOrder);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => setIsLoggedIn(!!user));
    });
  }, []);

  // PO periode check
  const now = new Date();
  const periodeStart = product?.periode_open_start ? new Date(product.periode_open_start) : null;
  const periodeEnd = product?.periode_open_end ? new Date(product.periode_open_end) : null;
  const poTutup = isPreorder && periodeEnd && now > periodeEnd;
  const poBelumBuka = isPreorder && periodeStart && now < periodeStart;
  const poDisabled = poTutup || poBelumBuka;

  const maxQty = isPreorder ? 999 : stock;
  const totalPrice = price * quantity;
  const dpAmount = dpPersen > 0 ? Math.round(totalPrice * dpPersen / 100) : totalPrice;
  const sisaBayar = dpPersen > 0 ? totalPrice - dpAmount : 0;

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
    const itemBeliLangsung = [
      {
        jumlah: quantity,
        produk: product,
      }
    ];

    sessionStorage.setItem("directCheckoutItem", JSON.stringify(itemBeliLangsung));
    router.push("/checkout?jalur=langsung");
  };

  const isOutOfStock = !isPreorder && stock === 0;

  return (
    <>
      <div className="flex flex-col gap-6 flex-1">
        {/* PO Periode Warning */}
        {isPreorder && poTutup && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Periode pre-order sudah tutup.</span>
          </div>
        )}
        {isPreorder && poBelumBuka && periodeStart && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <Clock className="w-4 h-4 shrink-0" />
            <span>PO dibuka mulai {periodeStart.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.</span>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            Jumlah Pembelian
            {isPreorder && minOrder > 1 && (
              <span className="text-xs text-violet-600 font-normal">min. {minOrder} item</span>
            )}
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(minOrder, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-slate-800 text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg"
              >
                +
              </button>
            </div>
            <span className="text-sm text-slate-500">
              {isPreorder ? "Pre-Order" : `Maks. ${stock} item`}
            </span>
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
          {dpPersen > 0 ? (
            <>
              <div className="flex justify-between items-center text-sm text-slate-500 mb-1">
                <span>Total harga</span>
                <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-orange-700">
                <span>DP sekarang ({dpPersen}%)</span>
                <span className="text-lg">Rp {dpAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                <span>Sisa bayar saat ambil</span>
                <span>Rp {sisaBayar.toLocaleString("id-ID")}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center font-bold text-slate-900">
              <span>Total</span>
              <span className="text-blue-600 text-lg">
                Rp {totalPrice.toLocaleString("id-ID")}
              </span>
            </div>
          )}
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
            disabled={isOutOfStock || isAddingToCart || !!poDisabled}
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
            disabled={isOutOfStock || !!poDisabled}
            className="w-full bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer truncate"
          >
            {dpPersen > 0 ? `Bayar DP` : "Checkout"}
          </button>
        </div>
      </div>

      {/* Success Toast */}
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

      {/* Error Toast */}
      {notificationError && (
        <div className="fixed bottom-8 right-8 z-50 bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <AlertCircle className="w-5 h-5 text-red-200" />
          <span className="font-semibold text-sm">{notificationError}</span>
        </div>
      )}
    </>
  );
}
