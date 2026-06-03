"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquare,
  Store,
  ChevronRight,
  Truck,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { Chat } from "@/components/Chat";

// --- Types ---
interface OrderItem {
  id: string;
  name: string;
  image: string;
  variation: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  storeName: string;
  status:
    | "Belum Bayar"
    | "Sedang Dikemas"
    | "Dikirim"
    | "Selesai"
    | "Dibatalkan";
  statusText: string;
  items: OrderItem[];
  totalPrice: number;
  isRated: boolean;
}

// --- Mock Data ---
const orders: Order[] = [
  {
    id: "ORD-2026-001",
    storeName: "HIMAIF - INVENTION 2045",
    status: "Selesai",
    statusText: "Pesanan tiba di alamat tujuan. Diterima langsung.",
    isRated: true,
    totalPrice: 15000,
    items: [
      {
        id: "p1",
        name: "Risol Mayo - 100% Daging Asli + Keju Mozzarella + Saus Premium - Frozen Food Makanan Ringan Camilan Sehat",
        image: "https://placehold.co/100x100?text=Risol+Mayo",
        variation: "Mayo",
        quantity: 3,
        price: 5000,
      },
    ],
  },
  {
    id: "ORD-2026-002",
    storeName: "HIMAAI - AI HACKATHON",
    status: "Dikirim",
    statusText: "Estimasi Tiba: 19 Mei. Pesanan telah diserahkan kepada kurir.",
    isRated: false,
    totalPrice: 7500,
    items: [
      {
        id: "p3",
        name: "Stiker AI HACKATHON",
        image: "https://placehold.co/100x100?text=Stiker",
        variation: "Stiker",
        quantity: 3,
        price: 2500,
      },
    ],
  },
];

const tabs = [
  "Semua",
  "Belum Bayar",
  "Sedang Dikemas",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
  "Pengembalian",
];

export default function PurchasePage() {
  const [activeTab, setActiveTab] = useState("Semua");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("Rp", "Rp ");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 ">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar (Only on Large Screens) */}
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile Header */}
            <MobileHeader
              title="Pesanan Saya"
              backHref="/"
              rightActions={["search", "chat"]}
              chatCount={1}
            />

            {/* Tabs */}
            <div className="bg-white md:rounded-sm shadow-sm sticky top-14 lg:top-0 z-30 w-full">
              <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-none px-5 md:px-8 py-3 md:py-4 text-sm font-medium transition-all relative min-w-fit text-center whitespace-nowrap cursor-pointer ${
                      activeTab === tab
                        ? "text-primary-600"
                        : "text-slate-600 hover:text-primary-600"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:block">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Kamu bisa cari berdasarkan Nama Penjual, No. Pesanan atau Nama Produk"
                  className="w-full px-12 py-3 bg-slate-100 border-none rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Order List */}
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white md:rounded-sm shadow-sm overflow-hidden"
                >
                  {/* Store Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-50 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-2 group cursor-pointer min-w-0">
                        <Store className="w-4 h-4 text-slate-700 shrink-0" />
                        <span className="font-bold text-sm group-hover:text-primary-600 truncate">
                          {order.storeName}
                        </span>
                      </div>
                      {/* <button className="hidden sm:flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-[11px] rounded-sm hover:bg-primary-700 shrink-0">
                        <MessageSquare className="w-3 h-3" /> Chat
                      </button> */}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Truck className="hidden sm:block w-4 h-4 text-emerald-500" />
                      <span className="text-[11px] sm:text-xs md:text-sm text-emerald-600 sm:pr-4 sm:border-r border-slate-100 whitespace-nowrap">
                        {order.status === "Selesai"
                          ? "TELAH DINILAI"
                          : order.status.toUpperCase()}
                      </span>
                      <span className="hidden sm:block text-primary-600 text-sm font-bold whitespace-nowrap">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-20 h-20 bg-slate-100 rounded-sm relative border border-slate-100 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-sm line-clamp-2 md:line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Variasi: {item.variation}
                          </p>
                          <p className="text-xs font-medium">
                            x{item.quantity}
                          </p>
                        </div>
                        <div className="text-right flex flex-col justify-end">
                          <span className="text-sm text-primary-600">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                        {order.status === "Dikirim" && (
                          <Truck className="w-4 h-4 shrink-0 text-emerald-500" />
                        )}
                        <p
                          className={`truncate sm:line-clamp-2 ${order.status === "Dikirim" ? "text-emerald-600" : ""}`}
                        >
                          {order.statusText}
                        </p>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <span className="text-xs sm:text-sm text-slate-600">
                          Total Pesanan:
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-primary-600">
                          {formatPrice(order.totalPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 mt-6">
                      {order.status === "Selesai" ? (
                        <>
                          <button className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-sm shadow-md hover:bg-primary-700 transition-all whitespace-nowrap">
                            Beli Lagi
                          </button>
                          <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium rounded-sm hover:bg-slate-50 whitespace-nowrap">
                            Hubungi Penjual
                          </button>
                          <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium rounded-sm hover:bg-slate-50 whitespace-nowrap">
                            Penilaian
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium rounded-sm hover:bg-slate-50 whitespace-nowrap">
                            Pengembalian
                          </button>
                          <button className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-sm shadow-md hover:bg-primary-700 whitespace-nowrap">
                            Lacak
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
