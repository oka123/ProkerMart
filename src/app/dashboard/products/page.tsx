"use client";

import { useState, useEffect, useMemo, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, PackageSearch, Tag, Image as ImageIcon,
  X, Loader2, Lock, Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";
import Image from "next/image";

const KATEGORI = ["Makanan", "Barang", "Jasa"];
const CAN_MANAGE = ["BendaharaProker", "KoorPenggalianDana", "WakilKoorPenggalianDana"];

interface Produk {
  id_produk: string;
  nama_produk: string;
  deskripsi: string | null;
  harga: number;
  stok: number;
  kategori: string | null;
  status_aktif: boolean;
  preorder: boolean;
  periode_open_start: string | null;
  periode_open_end: string | null;
  estimasi_siap: string | null;
  min_order: number;
  dp_persen: number;
  foto: string | null;
  metode_jualan: string | null;
}

interface FormState {
  nama_produk: string;
  deskripsi: string;
  harga: string;
  stok: string;
  kategori: string;
  status_aktif: boolean;
  is_preorder: boolean;
  periode_open_start: string;
  periode_open_end: string;
  estimasi_siap: string;
  min_order: string;
  dp_persen: string;
  foto: string;
  metode_pickup: boolean;
  metode_delivery: boolean;
}

const defaultForm: FormState = {
  nama_produk: "",
  deskripsi: "",
  harga: "",
  stok: "",
  kategori: "Barang",
  status_aktif: true,
  is_preorder: false,
  periode_open_start: "",
  periode_open_end: "",
  estimasi_siap: "",
  min_order: "1",
  dp_persen: "0",
  foto: "",
  metode_pickup: true,
  metode_delivery: true,
};

export default function ProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { active } = useDashboard();

  const currentUserRole = active?.role ?? null;
  const idSubToko = active?.id_sub_toko ?? null;
  const [loadingRole, setLoadingRole] = useState(true);

  const [products, setProducts] = useState<Produk[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Produk | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = currentUserRole ? CAN_MANAGE.includes(currentUserRole) : false;

  const fetchProducts = useCallback(async (subTokoId: string) => {
    setLoadingProducts(true);
    const { data } = await supabase
      .from("produk")
      .select("id_produk, nama_produk, deskripsi, harga, stok, kategori, status_aktif, preorder, periode_open_start, periode_open_end, estimasi_siap, min_order, dp_persen, foto, metode_jualan")
      .eq("id_sub_toko", subTokoId)
      .order("tgl_dibuat", { ascending: false });
    setProducts(data ?? []);
    setLoadingProducts(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      setLoadingRole(false);
      if (!idSubToko) {
        setLoadingProducts(false);
        return;
      }
      await fetchProducts(idSubToko);
    }
    init();
  }, [idSubToko, fetchProducts]);

  const toDatetimeLocal = (iso: string | null) => {
    if (!iso) return "";
    return iso.slice(0, 16);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setSaveError(null);
    setShowModal(true);
  };

  const openEdit = (p: Produk) => {
    setEditTarget(p);
    setForm({
      nama_produk: p.nama_produk,
      deskripsi: p.deskripsi ?? "",
      harga: String(p.harga),
      stok: String(p.stok),
      kategori: p.kategori ?? "Barang",
      status_aktif: p.status_aktif,
      is_preorder: p.preorder,
      periode_open_start: toDatetimeLocal(p.periode_open_start),
      periode_open_end: toDatetimeLocal(p.periode_open_end),
      estimasi_siap: p.estimasi_siap ?? "",
      min_order: String(p.min_order ?? 1),
      dp_persen: String(p.dp_persen ?? 0),
      foto: p.foto ?? "",
      metode_pickup: p.metode_jualan ? p.metode_jualan.includes("pickup") : true,
      metode_delivery: p.metode_jualan ? p.metode_jualan.includes("delivery") : true,
    });
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!idSubToko) return;

    if (!form.metode_pickup && !form.metode_delivery) {
      setSaveError("Pilih minimal satu metode penjualan (Pickup atau Delivery).");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const methods: string[] = [];
    if (form.metode_pickup) methods.push("pickup");
    if (form.metode_delivery) methods.push("delivery");

    const payload: Record<string, unknown> = {
      nama_produk: form.nama_produk,
      deskripsi: form.deskripsi || null,
      harga: parseFloat(form.harga),
      stok: form.kategori === "Jasa" ? 0 : parseInt(form.stok),
      kategori: form.kategori,
      status_aktif: form.status_aktif,
      id_sub_toko: idSubToko,
      preorder: form.is_preorder,
      foto: form.foto || null,
      metode_jualan: methods.join(","),
    };

    if (form.is_preorder) {
      payload.periode_open_start = form.periode_open_start || null;
      payload.periode_open_end = form.periode_open_end || null;
      payload.estimasi_siap = form.estimasi_siap || null;
      payload.min_order = parseInt(form.min_order) || 1;
      payload.dp_persen = parseInt(form.dp_persen) || 0;
    } else {
      payload.periode_open_start = null;
      payload.periode_open_end = null;
      payload.estimasi_siap = null;
      payload.min_order = 1;
      payload.dp_persen = 0;
    }

    if (editTarget) {
      const { error } = await supabase
        .from("produk")
        .update(payload)
        .eq("id_produk", editTarget.id_produk);
      if (error) { setSaveError(error.message); setIsSaving(false); return; }
      setProducts((prev) => prev.map((p) => p.id_produk === editTarget.id_produk ? { ...p, ...(payload as Partial<Produk>) } : p));
    } else {
      const { data, error } = await supabase
        .from("produk")
        .insert(payload)
        .select("id_produk, nama_produk, deskripsi, harga, stok, kategori, status_aktif, preorder, periode_open_start, periode_open_end, estimasi_siap, min_order, dp_persen, foto, metode_jualan")
        .single();
      if (error) { setSaveError(error.message); setIsSaving(false); return; }
      if (data) setProducts((prev) => [data as Produk, ...prev]);
    }

    setIsSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("produk").delete().eq("id_produk", id);
    setProducts((prev) => prev.filter((p) => p.id_produk !== id));
    setDeletingId(null);
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.nama_produk.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === "Semua" || p.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Katalog Produk</h1>
          <p className="text-sm text-slate-500">Kelola daftar produk, stok, dan harga untuk etalase proker Anda.</p>
        </div>
        {!loadingRole && (
          canManage ? (
            <button onClick={openAdd}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Produk Baru
            </button>
          ) : (
            <button disabled
              className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 cursor-not-allowed border border-slate-200">
              <Lock className="w-4 h-4" /> Tidak Ada Akses
            </button>
          )
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1">
            <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
            <option value="Semua">Semua Kategori</option>
            {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Belum ada produk.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Produk Info</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Status</th>
                {canManage && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product, i) => (
                <motion.tr key={product.id_produk}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                        {product.foto ? (
                          <Image src={product.foto} alt={product.nama_produk} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{product.nama_produk}</p>
                          {product.preorder && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                              <Clock className="w-2.5 h-2.5" /> PO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Tag className="w-3 h-3" /> {product.kategori ?? "—"}
                        </p>
                        {product.preorder && product.estimasi_siap && (
                          <p className="text-xs text-violet-600 mt-0.5">
                            Estimasi siap: {new Date(product.estimasi_siap).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">Rp {Number(product.harga).toLocaleString("id-ID")}</p>
                    {product.preorder && product.dp_persen > 0 && (
                      <p className="text-xs text-violet-600">DP {product.dp_persen}%</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${product.kategori === "Jasa" || product.preorder ? "text-slate-400 italic" : product.stok > 0 ? "text-slate-700" : "text-red-600"}`}>
                      {product.kategori === "Jasa" ? "—" : product.preorder ? "PO" : `${product.stok} pcs`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${product.status_aktif ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {product.status_aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(product)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id_produk)}
                          disabled={deletingId === product.id_produk}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                          {deletingId === product.id_produk
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  {editTarget ? "Edit Produk" : "Tambah Produk Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama Produk</label>
                  <input type="text" required value={form.nama_produk}
                    onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Contoh: Kaos Panitia Dies Natalis" />
                </div>

                {/* Foto Produk */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Foto Produk (opsional)</label>
                  <div className="space-y-3">
                    {form.foto ? (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 group bg-slate-50 flex items-center justify-center">
                        <Image src={form.foto} alt="Preview" width={128} height={128} className="w-full h-full object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, foto: "" })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500">Klik untuk unggah gambar (Max. 1MB)</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 1024 * 1024) {
                                alert("Ukuran gambar maksimal 1 MB");
                                return;
                              }
                              setIsSaving(true);
                              const fileExt = file.name.split(".").pop();
                              const fileName = `product_${idSubToko}_${Date.now()}.${fileExt}`;
                              try {
                                const { error: uploadError } = await supabase.storage
                                  .from("foto_produk")
                                  .upload(fileName, file, { upsert: true });
                                if (uploadError) throw uploadError;
                                const { data } = supabase.storage.from("foto_produk").getPublicUrl(fileName);
                                setForm((f) => ({ ...f, foto: data.publicUrl }));
                              } catch (err) {
                                console.error("[ProductsPage - upload] Error:", err);
                                alert("Gagal mengunggah foto.");
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Kategori</label>
                  <div className="flex gap-2">
                    {KATEGORI.map((k) => (
                      <button key={k} type="button"
                        onClick={() => setForm({ ...form, kategori: k })}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.kategori === k ? "bg-primary-600 text-white border-primary-600" : "border-slate-200 text-slate-600 hover:border-primary-300"}`}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metode Penjualan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Metode Penjualan</label>
                  <div className="flex gap-6 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                    <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.metode_pickup}
                        onChange={(e) => setForm({ ...form, metode_pickup: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      Ambil Sendiri (Pickup)
                    </label>
                    <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.metode_delivery}
                        onChange={(e) => setForm({ ...form, metode_delivery: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      Kirim (Delivery)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Harga (Rp)</label>
                    <input type="number" required min="0" value={form.harga}
                      onChange={(e) => setForm({ ...form, harga: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="15000" />
                  </div>
                  {form.kategori !== "Jasa" && !form.is_preorder && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Stok</label>
                      <input type="number" required min="0" value={form.stok}
                        onChange={(e) => setForm({ ...form, stok: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="50" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Deskripsi (opsional)</label>
                  <textarea value={form.deskripsi}
                    onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Deskripsi singkat produk..." />
                </div>

                {/* Pre-Order Toggle */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Pre-Order</p>
                      <p className="text-xs text-slate-500">Pembeli pesan dalam periode tertentu, barang diproduksi setelah PO ditutup</p>
                    </div>
                    <button type="button"
                      onClick={() => setForm({ ...form, is_preorder: !form.is_preorder })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_preorder ? "bg-violet-600" : "bg-slate-200"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_preorder ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {form.is_preorder && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Periode Buka PO</label>
                          <input type="datetime-local" required value={form.periode_open_start}
                            onChange={(e) => setForm({ ...form, periode_open_start: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Periode Tutup PO</label>
                          <input type="datetime-local" required value={form.periode_open_end}
                            onChange={(e) => setForm({ ...form, periode_open_end: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Estimasi Siap</label>
                        <input type="date" required value={form.estimasi_siap}
                          onChange={(e) => setForm({ ...form, estimasi_siap: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Min. Order (pcs)</label>
                          <input type="number" min="1" value={form.min_order}
                            onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="1" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">DP (%)</label>
                          <input type="number" min="0" max="100" value={form.dp_persen}
                            onChange={(e) => setForm({ ...form, dp_persen: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="0 = bayar full" />
                          <p className="text-xs text-slate-400 mt-1">0 = bayar penuh saat order</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setForm({ ...form, status_aktif: !form.status_aktif })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.status_aktif ? "bg-primary-600" : "bg-slate-200"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.status_aktif ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm text-slate-600">Status {form.status_aktif ? "Aktif" : "Nonaktif"}</span>
                </div>

                {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{saveError}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                    Batal
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editTarget ? "Simpan Perubahan" : "Tambah Produk"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
