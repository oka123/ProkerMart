"use client";

import Link from "next/link";
import { Store, Calendar, ArrowRight, MapPin, Info } from "lucide-react";
import type { SubTokoInfo } from "@/lib/types/product";

interface SellerCardProps {
  sellerInfo: SubTokoInfo;
}

export function SellerCard({ sellerInfo }: SellerCardProps) {
  const { id_sub_toko, nama_proker, deskripsi: subDeskripsi, jadwal_operasional, toko } = sellerInfo;
  const { id_toko, nama_toko, deskripsi: tokoDeskripsi, logo, organisasi } = toko;
  const orgName = organisasi?.nama_organisasi ?? "Organisasi";

  // Create links for navigation
  const tokoUrl = `/organizations/${id_toko}`;
  const subTokoUrl = `/organizations/${id_toko}/${id_sub_toko}`;

  // Avatar initials for the store if logo is not provided
  const storeInitials = nama_toko
    ? nama_toko
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TK";

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
      <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Store className="w-5 h-5 text-blue-600" />
        Informasi Penjual
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Toko Utama (Main Store) */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={nama_toko}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-md border border-slate-200 shadow-xs">
                  {storeInitials}
                </div>
              )}
              <div>
                <h4 className="font-bold text-slate-800 text-sm leading-tight">
                  {nama_toko}
                </h4>
                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {orgName}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
              {tokoDeskripsi ?? "Toko resmi organisasi mahasiswa untuk memasarkan berbagai produk berkualitas."}
            </p>
          </div>

          <Link
            href={tokoUrl}
            className="inline-flex items-center justify-center gap-1.5 w-full bg-white hover:bg-slate-100 text-slate-700 hover:text-blue-600 border border-slate-200 font-semibold py-2 px-4 rounded-xl transition duration-150 text-xs shadow-xs"
          >
            Kunjungi Toko Utama
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Right Side: Sub-toko (Proker Store) */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-blue-50/40 border border-blue-100/50">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-600 text-white p-1 rounded-lg">
                <MapPin className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm leading-tight">
                  Sub-toko: {nama_proker}
                </h4>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Bagian Program Kerja Event / Departemen
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-3">
              {subDeskripsi ?? "Sub-toko khusus yang menjual barang-barang berkaitan dengan program kerja ini."}
            </p>

            {/* Operational Schedule */}
            {jadwal_operasional && (
              <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-white/60 border border-slate-100 p-2 rounded-lg mb-4">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-700">Jadwal Operasional:</span>
                  <span>{jadwal_operasional}</span>
                </div>
              </div>
            )}
          </div>

          <Link
            href={subTokoUrl}
            className="inline-flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition duration-150 text-xs shadow-xs"
          >
            Kunjungi Sub-toko Proker
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
