"use client";

import React, { useState } from "react";

import { Navbar } from "@/components/Navbar";
import { ChevronRight, Minus, Plus, Ticket, ChevronDown } from "lucide-react";
import Image from "next/image";

// --- Types ---
interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  variation: string;
  stock: number;
  quantity: number;
  selected: boolean;
}

interface Store {
  id: string;
  name: string;
  // isStarPlus: boolean;
  items: Product[];
  selected: boolean;
}

// --- Mock Data ---
const initialStores: Store[] = [
  {
    id: "org-1",
    name: "HIMAIF - INVENTION 2045",
    // isStarPlus: true,
    selected: false,
    items: [
      {
        id: "prod-1",
        name: "RISOL",
        image: "https://placehold.co/100x100?text=Risol+Mayo",
        price: 13000,
        variation: "Mayo",
        stock: 100,
        quantity: 1,
        selected: false,
      },
    ],
  },
  {
    id: "org-2",
    name: "HIMA-AI - AI Hackathon 2045",
    // isStarPlus: true,
    selected: false,
    items: [
      {
        id: "prod-2",
        name: "KAOS",
        image: "https://placehold.co/100x100?text=Kaos",
        price: 150000,
        variation: "White / L",
        stock: 12,
        quantity: 1,
        selected: false,
      },
    ],
  },
];

export default function CartPage() {
  const [stores, setStores] = useState<Store[]>(initialStores);

  // --- Derived State ---
  const { totalPrice, totalCount, isAllSelected } = React.useMemo(() => {
    let price = 0;
    let count = 0;
    stores.forEach((store) => {
      store.items.forEach((item) => {
        if (item.selected) {
          price += item.price * item.quantity;
          count += 1;
        }
      });
    });

    const allItemsSelected =
      stores.length > 0 &&
      stores.every((s) => s.items.every((i) => i.selected));

    return {
      totalPrice: price,
      totalCount: count,
      isAllSelected: allItemsSelected,
    };
  }, [stores]);

  const handleSelectAll = () => {
    const newState = !isAllSelected;
    setStores(
      stores.map((store) => ({
        ...store,
        selected: newState,
        items: store.items.map((item) => ({ ...item, selected: newState })),
      })),
    );
  };

  const handleSelectStore = (storeId: string) => {
    setStores(
      stores.map((store) => {
        if (store.id === storeId) {
          const newState = !store.selected;
          return {
            ...store,
            selected: newState,
            items: store.items.map((item) => ({ ...item, selected: newState })),
          };
        }
        return store;
      }),
    );
  };

  const handleSelectItem = (storeId: string, itemId: string) => {
    setStores(
      stores.map((store) => {
        if (store.id === storeId) {
          const newItems = store.items.map((item) => {
            if (item.id === itemId)
              return { ...item, selected: !item.selected };
            return item;
          });
          return {
            ...store,
            items: newItems,
            selected: newItems.every((i) => i.selected),
          };
        }
        return store;
      }),
    );
  };

  const updateQuantity = (storeId: string, itemId: string, delta: number) => {
    setStores(
      stores.map((store) => {
        if (store.id === storeId) {
          return {
            ...store,
            items: store.items.map((item) => {
              if (item.id === itemId) {
                const newQty = Math.max(
                  1,
                  Math.min(item.stock, item.quantity + delta),
                );
                return { ...item, quantity: newQty };
              }
              return item;
            }),
          };
        }
        return store;
      }),
    );
  };

  const removeItem = (storeId: string, itemId: string) => {
    setStores(
      stores
        .map((store) => {
          if (store.id === storeId) {
            return {
              ...store,
              items: store.items.filter((item) => item.id !== itemId),
            };
          }
          return store;
        })
        .filter((store) => store.items.length > 0),
    );
  };

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
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <Navbar variant="cart" />

      <main className="flex-1 max-w-7xl mx-auto w-full md:px-4 lg:px-8 py-4 md:py-6 space-y-4">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_150px_150px_150px_100px] gap-4 bg-white p-4 rounded-sm shadow-sm text-sm text-slate-500 items-center">
          <div className="flex items-center gap-3 px-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-5 h-5 accent-primary-600 cursor-pointer"
            />
            <span className="text-slate-800">Produk</span>
          </div>
          <div></div>
          <div className="text-center">Harga Satuan</div>
          <div className="text-center">Kuantitas</div>
          <div className="text-center">Total Harga</div>
          <div className="text-center">Aksi</div>
        </div>

        {/* Store & Items List */}
        <div className="space-y-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-white rounded-sm shadow-sm overflow-hidden"
            >
              {/* Store Header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <input
                  type="checkbox"
                  checked={store.selected}
                  onChange={() => handleSelectStore(store.id)}
                  className="w-5 h-5 accent-primary-600 cursor-pointer"
                />
                <div className="flex items-center gap-2 cursor-pointer group">
                  {/* {store.isStarPlus && (
                    <span className="bg-primary-600 text-white text-[10px] font-bold px-1 rounded-sm">
                      Star+
                    </span>
                  )} */}
                  <span className="font-medium group-hover:text-primary-600 transition-colors">
                    {store.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
                </div>
                <div className="ml-auto md:hidden">
                  <button className="text-sm text-slate-500">Ubah</button>
                </div>
              </div>

              {/* Items */}
              {store.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b border-slate-50 last:border-0"
                >
                  {/* Desktop Item Layout */}
                  <div className="hidden md:grid grid-cols-[auto_1fr_150px_150px_150px_100px] gap-4 items-center">
                    <div className="px-2">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleSelectItem(store.id, item.id)}
                        className="w-5 h-5 accent-primary-600 cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="w-20 h-20 bg-slate-100 rounded-sm relative overflow-hidden border border-slate-200">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-sm line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-sm text-xs text-slate-500 cursor-pointer hover:border-primary-200 transition-colors">
                          Variasi: {item.variation}{" "}
                          <ChevronDown className="w-3 h-3" />
                        </div>
                        <div className="flex gap-1">
                          <Image
                            src="https://placehold.co/40x15?text=PROMO"
                            alt="Promo"
                            width={40}
                            height={15}
                            unoptimized
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm">
                      {formatPrice(item.price)}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex border border-slate-200 rounded-sm overflow-hidden">
                        <button
                          onClick={() => updateQuantity(store.id, item.id, -1)}
                          className="px-2 py-1 hover:bg-slate-50 transition-colors disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          readOnly
                          className="w-12 text-center text-sm border-x border-slate-200 focus:outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(store.id, item.id, 1)}
                          className="px-2 py-1 hover:bg-slate-50 transition-colors disabled:opacity-30"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[11px] text-primary-600">
                        tersisa {item.stock} buah
                      </span>
                    </div>
                    <div className="text-center text-sm font-medium text-primary-600">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => removeItem(store.id, item.id)}
                        className="text-sm hover:text-red-600 transition-colors"
                      >
                        Hapus
                      </button>
                      {/* <button className="text-xs text-primary-600 flex items-center gap-1 hover:underline">
                        Produk Serupa <ChevronDown className="w-3 h-3" />
                      </button> */}
                    </div>
                  </div>

                  {/* Mobile Item Layout */}
                  <div className="md:hidden flex gap-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleSelectItem(store.id, item.id)}
                        className="w-5 h-5 accent-primary-600 cursor-pointer"
                      />
                    </div>
                    <div className="w-24 h-24 bg-slate-100 rounded-sm relative overflow-hidden border border-slate-200">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-sm line-clamp-2 leading-snug">
                        {item.name}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-sm text-[11px] text-slate-500">
                        Variasi: {item.variation}{" "}
                        <ChevronDown className="w-3 h-3" />
                      </div>
                      <div className="flex gap-1 py-1">
                        <Image
                          src="https://placehold.co/40x15?text=PROMO"
                          alt="Promo"
                          width={40}
                          height={15}
                          unoptimized
                        />
                      </div>
                      <div className="text-sm font-medium text-primary-600">
                        {formatPrice(item.price)}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex border border-slate-200 rounded-sm overflow-hidden scale-90 origin-left">
                          <button
                            onClick={() =>
                              updateQuantity(store.id, item.id, -1)
                            }
                            className="px-2 py-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            value={item.quantity}
                            readOnly
                            className="w-10 text-center text-xs border-x border-slate-200"
                          />
                          <button
                            onClick={() => updateQuantity(store.id, item.id, 1)}
                            className="px-2 py-1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[11px] text-primary-600">
                          tersisa {item.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Promo Row */}
              {/* <div className="p-3 bg-slate-50/50 space-y-2 text-xs border-t border-slate-50">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors group">
                  <Ticket className="w-4 h-4 text-primary-600" />
                  <span className="flex-1">
                    Tersedia Voucher Diskon s/d 80%
                  </span>
                  <div className="flex items-center gap-1 text-primary-600 font-medium">
                    <span className="hidden md:inline">Voucher Lainnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors group">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <span className="flex-1">
                    Gratis Ongkir s/d Rp60.000 dengan min. belanja Rp150.000
                  </span>
                  <div className="flex items-center gap-1 text-primary-600 font-medium">
                    <span className="hidden md:inline">
                      Pelajari lebih lanjut
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div> */}
            </div>
          ))}
        </div>

        {/* Info Banner */}
        {/* <div className="bg-orange-50 border border-orange-100 p-4 rounded-sm flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <p className="text-slate-700">
              Hapus produk yang sudah tidak kamu perlukan.
            </p>
          </div>
          <button className="px-4 py-1.5 border border-orange-500 text-orange-500 font-medium rounded-sm hover:bg-orange-500 hover:text-white transition-all">
            Hapus
          </button>
        </div> */}
      </main>

      {/* Sticky Bottom Bar - Desktop */}
      <div className="hidden md:block sticky bottom-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-5 h-5 accent-primary-600 cursor-pointer"
                />
                <span className="text-sm">Pilih Semua ({totalCount})</span>
              </div>
              <button className="text-sm hover:text-primary-600 transition-colors">
                Hapus
              </button>
              <button className="text-sm hover:text-primary-600 transition-colors">
                Pindahkan ke Favorit Saya
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Total ({totalCount} produk):</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  Potongan <span className="text-primary-600">Rp 0</span>
                </div>
              </div>
              <button className="px-12 py-3 bg-primary-600 text-white font-bold rounded-sm shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar - Mobile */}
      <div className="md:hidden sticky bottom-0 bg-white border-t border-slate-100 z-40">
        {/* Promo Section Above Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50 text-[11px]">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary-600" />
            <span>Voucher ProkerMart</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            Gunakan/masukkan kode <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        {/* Checkout Bar */}
        <div className="flex items-center h-16">
          <div className="flex flex-col items-center justify-center px-4 border-r border-slate-50">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-5 h-5 accent-primary-600"
            />
            <span className="text-[10px] text-slate-500 mt-0.5">Semua</span>
          </div>
          <div className="flex-1 px-4 text-right">
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-lg font-bold text-primary-600 leading-tight">
              {formatPrice(totalPrice)}
            </div>
          </div>
          <button className="h-full px-8 bg-primary-600 text-white font-bold text-sm">
            Checkout ({totalCount})
          </button>
        </div>
      </div>

      {/* Floating Action (Chat) - Desktop Only */}
      {/* <button className="hidden md:flex fixed bottom-24 right-8 w-14 h-14 bg-white border border-slate-200 rounded-full shadow-lg items-center justify-center text-primary-600 hover:bg-slate-50 transition-all group z-50">
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">9</span>
      </button> */}
    </div>
  );
}
