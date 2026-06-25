"use client";

import {
  ShoppingBag,
  MapPin,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/supabase/queries/cart";
import type { Product } from "@/lib/types/product";

function getProductTag(metode: string | null | undefined): {
  label: string;
  color: string;
} {
  const m = metode?.toLowerCase() ?? "";
  if (m.includes("pickup") && m.includes("delivery"))
    return { label: "Pickup & Delivery", color: "bg-blue-100 text-blue-700" };
  if (m.includes("delivery"))
    return { label: "Delivery", color: "bg-purple-100 text-purple-700" };
  if (m.includes("pickup"))
    return { label: "Pickup", color: "bg-emerald-100 text-emerald-700" };
  return { label: "Ready Stock", color: "bg-amber-100 text-amber-700" };
}

interface ProductCardProps {
  product: Product;
  /** Used for staggered entrance animation; capped to avoid long delays */
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => setIsLoggedIn(!!user));
    });
  }, []);

  const tag = getProductTag(product.metode_jualan);
  const orgName = product.sub_toko?.toko?.organisasi?.nama_organisasi ?? "-";
  const prokerName = product.sub_toko?.nama_proker ?? "-";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (product.stok <= 0) return;

    setIsAddingToCart(true);
    setNotificationError(null);

    const result = await addToCart(product.id_produk, 1);

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

  return (
    <>
      <Link href={`/explore/${product.id_produk}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
          className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col h-full"
        >
          {/* Image */}
          <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
            {product.foto ? (
              <Image
                src={product.foto}
                alt={product.nama_produk}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            ) : (
              <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
              <span
                className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${tag.color}`}
              >
                {tag.label}
              </span>
              {product.preorder && (
                <span className="px-2 py-1 rounded-md text-xs font-bold shadow-sm bg-orange-100 text-orange-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Preorder
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-4 flex flex-col flex-1">
            <p className="text-xs font-semibold text-primary-600 mb-1 flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {orgName} · {prokerName}
            </p>
            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
              {product.nama_produk}
            </h3>
            <div className="mt-auto pt-4">
              <p className="text-xs text-slate-500 mb-1">
                Stok: {product.stok}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-primary-600 text-lg">
                  Rp {Number(product.harga).toLocaleString("id-ID")}
                </span>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stok === 0 || isAddingToCart}
                  className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingToCart ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "+"
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Success Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-8 right-8 z-110">
          <Link href="/cart">
            <div className="bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 hover:scale-105 transition-transform cursor-pointer">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-sm">
                {product.nama_produk} ditambahkan ke keranjang!
              </span>
            </div>
          </Link>
        </div>
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
