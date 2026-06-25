"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  MapPin,
} from "lucide-react";
import { ProductCard } from "@/components/explore/ProductCard";
import {
  FilterModal,
  FilterValues,
  DEFAULT_FILTERS,
  PRICE_PRESETS,
  countActiveFilters,
} from "@/components/explore/FilterModal";
import type { Product, Category } from "@/lib/types/product";
import { CATEGORIES } from "@/lib/types/product";
import Link from "next/link";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "termurah", label: "Termurah" },
  { value: "termahal", label: "Termahal" },
  { value: "stok", label: "Stok Terbanyak" },
];

interface ActiveFilters extends FilterValues {
  category: Category;
  search: string;
  sort: string;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
      <div className="aspect-square bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
        <div className="h-6 bg-slate-200 rounded w-1/2 mt-3" />
      </div>
    </div>
  );
}

export function ExploreClient() {
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter/sort state (drives UI rendering)
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("Semua");
  const [activeSort, setActiveSort] = useState("terbaru");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Advanced filter modal state
  const [appliedFilters, setAppliedFilters] =
    useState<FilterValues>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Refs for stale-closure-safe access in callbacks
  const pageRef = useRef(1);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const filtersRef = useRef<ActiveFilters>({
    ...DEFAULT_FILTERS,
    category: "Semua",
    search: "",
    sort: "terbaru",
  });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Stable fetch function ──────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (page: number, filters: ActiveFilters, append: boolean) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort: filters.sort,
        });

        if (filters.category !== "Semua")
          params.set("category", filters.category);
        if (filters.search.trim()) params.set("search", filters.search.trim());

        // Advanced filters
        const pricePreset = PRICE_PRESETS.find(
          (p) => p.value === filters.pricePreset,
        );
        if (pricePreset?.min !== undefined)
          params.set("harga_min", String(pricePreset.min));
        if (pricePreset?.max !== undefined)
          params.set("harga_max", String(pricePreset.max));
        if (filters.metode.length > 0)
          params.set("metode", filters.metode.join(","));
        if (filters.inStockOnly) params.set("stok", "1");

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil produk");
        const json = await res.json();

        setProducts((prev) =>
          append ? [...prev, ...json.products] : json.products,
        );
        hasMoreRef.current = json.hasMore;
        setHasMore(json.hasMore);
        setTotal(json.total);
      } catch (err) {
        console.error("[ExploreClient - fetchPage] Error:", err);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [],
  );

  // ── Reset & re-fetch when any filter changes ───────────────────────────────
  useEffect(() => {
    const filters: ActiveFilters = {
      ...appliedFilters,
      category: activeCategory,
      search: searchQuery,
      sort: activeSort,
    };
    filtersRef.current = filters;
    pageRef.current = 1;
    hasMoreRef.current = true;
    queueMicrotask(() => {
      setIsInitialLoad(true);
      fetchPage(1, filters, false);
    });
  }, [activeCategory, searchQuery, activeSort, appliedFilters, fetchPage]);

  // ── Infinite scroll sentinel ───────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isLoadingRef.current
        ) {
          pageRef.current += 1;
          fetchPage(pageRef.current, filtersRef.current, true);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPage]);

  // ── Close sort dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearchQuery(value), 500);
  };

  useEffect(
    () => () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    },
    [],
  );

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? "Terbaru";
  const activeFilterCount = countActiveFilters(appliedFilters);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Sticky Search + Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari produk..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-slate-900 outline-none"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className={`relative flex items-center justify-center px-4 rounded-xl border-2 transition-all ${
                activeFilterCount > 0
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Sekitarmu dan Categories */}
          <div className="flex items-center gap-2 mt-4">
            <Link
              href="/explore/nearby"
              className="flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors bg-primary-100 text-primary-600 hover:bg-primary-200 gap-2"
            >
              <MapPin className="w-4 h-4" />
              Sekitarmu
            </Link>

            <div className="h-8 border-r-2 border-slate-200" />

            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Header: title + sort */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Eksplor Produk
            </h1>
            {!isInitialLoad && (
              <p className="text-sm text-slate-500 mt-0.5">
                {total} produk ditemukan
              </p>
            )}
          </div>

          {/* Sort Dropdown */}
          <div ref={sortDropdownRef} className="relative">
            <button
              onClick={() => setIsSortOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-primary-400 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline text-slate-400">Urutkan:</span>
              <span className="font-semibold text-primary-600">
                {activeSortLabel}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setActiveSort(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      activeSort === opt.value
                        ? "text-primary-600 font-semibold bg-primary-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid content */}
        {isInitialLoad ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, i) => (
              <ProductCard
                key={product.id_produk}
                product={product}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Produk tidak ditemukan
            </h3>
            <p className="text-slate-500">
              Coba ubah kata kunci, filter, atau kategori.
            </p>
          </div>
        )}

        {/* Sentinel for IntersectionObserver */}
        <div ref={sentinelRef} className="h-1 mt-8" aria-hidden="true" />

        {isLoading && !isInitialLoad && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        )}

        {!hasMore && products.length > 0 && !isLoading && (
          <p className="text-center text-sm text-slate-400 py-6">
            Semua {total} produk sudah ditampilkan.
          </p>
        )}
      </main>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initialValues={appliedFilters}
        onApply={(newFilters) => setAppliedFilters(newFilters)}
      />
    </>
  );
}
