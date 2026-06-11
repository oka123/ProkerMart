"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";

// ─── Types & Constants ───────────────────────────────────────────────────────

export interface FilterValues {
  pricePreset: string;
  metode: string[];
  inStockOnly: boolean;
}

export const DEFAULT_FILTERS: FilterValues = {
  pricePreset: "all",
  metode: [],
  inStockOnly: false,
};

export const PRICE_PRESETS = [
  { value: "all", label: "Semua Harga", min: undefined, max: undefined },
  { value: "<15k", label: "Di bawah Rp 15.000", min: undefined, max: 15000 },
  { value: "15k-50k", label: "Rp 15.000 – Rp 50.000", min: 15000, max: 50000 },
  {
    value: "50k-100k",
    label: "Rp 50.000 – Rp 100.000",
    min: 50000,
    max: 100000,
  },
  { value: ">100k", label: "Di atas Rp 100.000", min: 100000, max: undefined },
];

const METODE_OPTIONS = [
  { value: "pickup", label: "🏪 Pickup" },
  { value: "delivery", label: "🚚 Delivery" },
];

// ─── Count active filters (for badge) ────────────────────────────────────────
export function countActiveFilters(f: FilterValues): number {
  return (
    (f.pricePreset !== "all" ? 1 : 0) +
    (f.metode.length > 0 ? 1 : 0) +
    (f.inStockOnly ? 1 : 0)
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: FilterValues;
  onApply: (filters: FilterValues) => void;
}

export function FilterModal({
  isOpen,
  onClose,
  initialValues,
  onApply,
}: FilterModalProps) {
  const [values, setValues] = useState<FilterValues>(initialValues);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleMetode = (m: string) =>
    setValues((v) => ({
      ...v,
      metode: v.metode.includes(m)
        ? v.metode.filter((x) => x !== m)
        : [...v.metode, m],
    }));

  const handleReset = () => setValues(DEFAULT_FILTERS);

  const handleApply = () => {
    onApply(values);
    onClose();
  };

  const activeCount = countActiveFilters(values);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal — bottom sheet on mobile, centered on md+ */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                       bg-white rounded-t-3xl md:rounded-2xl shadow-2xl z-50
                       w-full md:w-120 max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Filter Produk
                </h2>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-scroll px-6 py-5 space-y-7">
              {/* Price Range */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Rentang Harga
                </h3>
                <div className="flex flex-col gap-2">
                  {PRICE_PRESETS.map((preset) => (
                    <label
                      key={preset.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        values.pricePreset === preset.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="price"
                        value={preset.value}
                        checked={values.pricePreset === preset.value}
                        onChange={() =>
                          setValues((v) => ({
                            ...v,
                            pricePreset: preset.value,
                          }))
                        }
                        className="accent-primary-600"
                      />
                      <span
                        className={`text-sm font-medium ${
                          values.pricePreset === preset.value
                            ? "text-primary-700"
                            : "text-slate-700"
                        }`}
                      >
                        {preset.label}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Metode Jualan */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Metode Penjualan
                </h3>
                <div className="flex flex-wrap gap-2">
                  {METODE_OPTIONS.map((opt) => {
                    const active = values.metode.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleMetode(opt.value)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          active
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Pilih satu atau lebih. Kosong = tampilkan semua.
                </p>
              </section>

              {/* Ketersediaan */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Ketersediaan
                </h3>
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    values.inStockOnly
                      ? "border-primary-500 bg-primary-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={values.inStockOnly}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        inStockOnly: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded accent-primary-600"
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        values.inStockOnly
                          ? "text-primary-700"
                          : "text-slate-700"
                      }`}
                    >
                      Hanya tampilkan yang tersedia
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sembunyikan produk dengan stok 0
                    </p>
                  </div>
                </label>
              </section>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 px-4 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
              >
                Terapkan
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
