"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "./ProductCard";

export function RekomendasiSection() {

    const [userId, setUserId] = useState<string | null>(null)
    const [riwayat, setRiwayat] = useState<any[]>([]);
    const [kategoriFavorit, setKategoriFavorit] = useState<string | null>(null);
    const [idTokoFavorit, setIdTokoFavorit] = useState<string | null>(null);
    const [idProdukDibeli, setIdProdukDibeli] = useState<string[]>([]);
    const [rekomendasi, setRekomendasi] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        // Cek siapa user yang sedang login
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });
    }, []);

    // Ambil riwayat beli setelah user login
    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();

        async function ambilRiwayat() {

            const { data, error } = await supabase
                .from("pesanan")
                .select('id_pesanan, detail_pesanan (id_produk, produk (id_produk, kategori, sub_toko (id_sub_toko, toko (id_toko, organisasi (id_organisasi)))))'

                )
                .eq("id_pengguna", userId)
                .in("status_pesanan", ["menunggu_konfirmasi", "diproses", "dikirim", "selesai"]);

            if (error) {
                console.error("Gagal ambil riwayat:", error.message);
                return;
            }

            setRiwayat(data ?? []);
            console.log("Riwayat beli:", data);
        }
        ambilRiwayat();
    }, [userId]);

    // Hitung kategori favorit & toko favorit
    useEffect(() => {
        if (riwayat.length === 0) return;

        // Kumpulkan semua produk dari semua pesanan
        const semuaProduk = riwayat.flatMap((pesanan: any) =>
            pesanan.detail_pesanan.map((detail: any) => detail.produk)
        );

        // Kumpulkan id produk yang sudah dibeli (untuk filter nanti)
        const dibeli = semuaProduk.map((p: any) => p.id_produk);
        setIdProdukDibeli(dibeli);

        // Hitung kategori paling sering muncul
        const hitungKategori: Record<string, number> = {};
        semuaProduk.forEach((p: any) => {
            if (p.kategori) {
                hitungKategori[p.kategori] = (hitungKategori[p.kategori] ?? 0) + 1;
            }
        });
        // Ambil kategori dengan jumlah terbanyak
        const kategoriFav = Object.entries(hitungKategori)
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        setKategoriFavorit(kategoriFav);

        // Hitung toko paling sering muncul
        // Jalur: produk → sub_toko → toko → organisasi → id_organisasi
        const hitungOrganisasi: Record<string, number> = {};
        semuaProduk.forEach((p: any) => {
            const idOrg = p.sub_toko?.toko?.organisasi?.id_organisasi;
            if (idOrg) {
                hitungOrganisasi[idOrg] = (hitungOrganisasi[idOrg] ?? 0) + 1;
            }
        });
        const organisasiFav = Object.entries(hitungOrganisasi)
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        setIdTokoFavorit(organisasiFav);

        console.log("Kategori favorit:", kategoriFav);
        console.log("Organisasi favorit:", organisasiFav);
        console.log("Produk sudah dibeli:", dibeli);
    }, [riwayat]);

    // Fetch rekomendasi
    useEffect(() => {
        // Jangan fetch kalau userId belum ada
        if (!userId) return;

        const supabase = createClient();

        async function ambilRekomendasi() {
            setIsLoading(true);

            // ── Langkah A: Jika ada organisasi favorit,
            //    cari dulu semua id_sub_toko milik organisasi itu ──────────────────
            let daftarSubTokoOrganisasi: string[] = [];

            if (idTokoFavorit) {
                const { data: subTokoData } = await supabase
                    .from("sub_toko")
                    .select("id_sub_toko, toko(id_organisasi)")
                    .eq("toko.id_organisasi", idTokoFavorit);

                daftarSubTokoOrganisasi = (subTokoData ?? [])
                    .filter((s: any) => s.toko?.id_organisasi === idTokoFavorit)
                    .map((s: any) => s.id_sub_toko);

                console.log("Sub toko dari organisasi favorit:", daftarSubTokoOrganisasi);
            }

            // ── Langkah B: Fetch produk berdasarkan dua strategi ─────────────────
            let query = supabase
                .from("produk")
                .select(`*, sub_toko(*, toko(*, organisasi(*)))`)
                .eq("status_aktif", true)
                .limit(10);

            if (kategoriFavorit || daftarSubTokoOrganisasi.length > 0) {
                // Ada riwayat → gabungkan dua strategi dengan OR
                const kondisiOr: string[] = [];

                if (kategoriFavorit) {
                    kondisiOr.push(`kategori.eq.${kategoriFavorit}`);
                }

                if (daftarSubTokoOrganisasi.length > 0) {
                    // Filter produk yang id_sub_toko-nya ada di daftar organisasi favorit
                    kondisiOr.push(
                        `id_sub_toko.in.(${daftarSubTokoOrganisasi.join(",")})`
                    );
                }

                query = query.or(kondisiOr.join(","));

                // Exclude produk yang sudah pernah dibeli
                if (idProdukDibeli.length > 0) {
                    query = query.not(
                        "id_produk",
                        "in",
                        `(${idProdukDibeli.join(",")})`
                    );
                }
            } else {
                // User baru, belum ada riwayat → tampilkan terbaru
                query = query.order("tgl_dibuat", { ascending: false });
            }


            const { data, error } = await query;

            if (error) {
                console.error("Gagal fetch rekomendasi:", error.message);
                setIsLoading(false);
                return;
            }


            console.log("Raw data dari Supabase:", data);
            console.log("Jumlah produk:", data?.length);

            // Campur rata (shuffle) hasilnya
            const shuffled = (data ?? []).sort(() => Math.random() - 0.5);
            setRekomendasi(shuffled);
            setIsLoading(false);
        }

        ambilRekomendasi();
    }, [kategoriFavorit, idTokoFavorit, idProdukDibeli, userId]);

    // Belum login → section tidak tampil sama sekali
    if (!userId) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
                Rekomendasi untuk Anda
            </h2>

            {isLoading ? (
                // Loading skeleton
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="min-w-[200px] h-64 bg-slate-200 rounded-2xl animate-pulse flex-shrink-0" />
                    ))}
                </div>
            ) : rekomendasi.length > 0 ? (
                // Horizontal scroll produk
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide items-stretch">

                    {rekomendasi.map((product) => (
                        // 2. flex-none mencegah card menyusut. 
                        // 3. Lebar (w-[...]) disetel merespons ukuran layar agar persis seperti grid di bawahnya
                        <div
                            key={product.id_produk}
                            className="flex-none w-[180px] sm:w-[220px] md:w-[240px] lg:w-[280px] flex"
                        >
                            <div className="w-full h-full">
                                <ProductCard product={product} index={0} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}