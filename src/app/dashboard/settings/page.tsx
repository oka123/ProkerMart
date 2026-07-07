"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";
import { Settings, MapPin, Clock, FileText, Store, Edit3, X, Loader2, Lock, Save, AlertCircle, Navigation } from "lucide-react";
import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(
  () => import("@/components/user/LocationPickerMap"),
  { ssr: false },
);

const CAN_EDIT = ["KetuaProker", "WakilProker", "SekretarisProker", "BendaharaProker"];

interface SubTokoData {
  nama_proker: string;
  deskripsi: string | null;
  jadwal_operasional: string | null;
  alamat: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  tgl_dibuat: string | null;
}

interface FormState {
  nama_proker: string;
  deskripsi: string;
  jadwal_operasional: string;
  alamat: string;
  latitude: string;
  longitude: string;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { active } = useDashboard();
  const idSubToko = active?.id_sub_toko ?? null;
  const role = active?.role ?? null;

  const [data, setData] = useState<SubTokoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormState>({
    nama_proker: "",
    deskripsi: "",
    jadwal_operasional: "",
    alamat: "",
    latitude: "",
    longitude: "",
  });

  const canEdit = role ? CAN_EDIT.includes(role) : false;

  useEffect(() => {
    async function fetchData() {
      if (!idSubToko) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: d, error: e } = await supabase
        .from("sub_toko")
        .select("nama_proker, deskripsi, jadwal_operasional, alamat, latitude, longitude, status, tgl_dibuat")
        .eq("id_sub_toko", idSubToko)
        .single();
      if (e || !d) { setLoading(false); return; }
      setData(d);
      setForm({
        nama_proker: d.nama_proker ?? "",
        deskripsi: d.deskripsi ?? "",
        jadwal_operasional: d.jadwal_operasional ?? "",
        alamat: d.alamat ?? "",
        latitude: d.latitude != null ? String(d.latitude) : "",
        longitude: d.longitude != null ? String(d.longitude) : "",
      });
      setLoading(false);
    }
    fetchData();
  }, [idSubToko, supabase]);

  const handleCancel = () => {
    if (!data) return;
    setForm({
      nama_proker: data.nama_proker ?? "",
      deskripsi: data.deskripsi ?? "",
      jadwal_operasional: data.jadwal_operasional ?? "",
      alamat: data.alamat ?? "",
      latitude: data.latitude != null ? String(data.latitude) : "",
      longitude: data.longitude != null ? String(data.longitude) : "",
    });
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!idSubToko || !form.nama_proker.trim()) {
      setError("Nama proker wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        nama_proker: form.nama_proker.trim(),
        deskripsi: form.deskripsi.trim() || null,
        jadwal_operasional: form.jadwal_operasional.trim() || null,
        alamat: form.alamat.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      const { error: e } = await supabase
        .from("sub_toko")
        .update(payload)
        .eq("id_sub_toko", idSubToko);
      if (e) throw e;
      setData((prev) => prev ? { ...prev, ...payload } as SubTokoData : prev);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      console.error("[SettingsPage - handleSave] Error:", e);
      setError(e instanceof Error ? e.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <div className="h-8 w-64 bg-slate-200 rounded-xl animate-pulse" />
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm">Sub toko tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sub Toko</h1>
          <p className="text-sm text-slate-500">Informasi dan konfigurasi sub toko Anda.</p>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Edit Pengaturan
          </button>
        )}
        {!canEdit && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 text-sm font-medium rounded-xl border border-slate-200">
            <Lock className="w-4 h-4" /> Hanya Bisa Melihat
          </div>
        )}
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm text-emerald-700 font-medium flex items-center gap-2">
          <Save className="w-4 h-4" /> Pengaturan berhasil disimpan.
        </div>
      )}

      {/* Role notice for non-editors */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Akses Terbatas</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Hanya Ketua, Wakil, Sekretaris, dan Bendahara yang dapat mengubah pengaturan sub toko.
            </p>
          </div>
        </div>
      )}

      {/* Informasi Umum */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <Store className="w-5 h-5 text-primary-600" />
          <h2 className="font-bold text-slate-900 text-sm">Informasi Umum</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Nama Proker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama Sub Toko / Proker</label>
            {editing ? (
              <input
                type="text"
                value={form.nama_proker}
                onChange={(e) => setForm((f) => ({ ...f, nama_proker: e.target.value }))}
                placeholder="cth. Divisi Penggalian Dana"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-900 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">{data.nama_proker}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <FileText className="w-3.5 h-3.5" /> Deskripsi
            </label>
            {editing ? (
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Deskripsi singkat tentang sub toko ini..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
              />
            ) : (
              <p className="text-sm text-slate-700 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 min-h-18 whitespace-pre-wrap">
                {data.deskripsi || <span className="text-slate-400 italic">Belum ada deskripsi.</span>}
              </p>
            )}
          </div>

          {/* Jadwal Operasional */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <Clock className="w-3.5 h-3.5" /> Jadwal Operasional
            </label>
            {editing ? (
              <textarea
                value={form.jadwal_operasional}
                onChange={(e) => setForm((f) => ({ ...f, jadwal_operasional: e.target.value }))}
                placeholder="cth. Senin–Jumat 08.00–16.00, Sabtu 09.00–13.00"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
              />
            ) : (
              <p className="text-sm text-slate-700 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {data.jadwal_operasional || <span className="text-slate-400 italic">Belum diatur.</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lokasi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <MapPin className="w-5 h-5 text-primary-600" />
          <h2 className="font-bold text-slate-900 text-sm">Lokasi & Alamat</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Alamat */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Alamat</label>
            {editing ? (
              <textarea
                value={form.alamat}
                onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                placeholder="cth. Gedung A lt. 2, Kampus Universitas Udayana"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
              />
            ) : (
              <p className="text-sm text-slate-700 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {data.alamat || <span className="text-slate-400 italic">Belum ada alamat.</span>}
              </p>
            )}
          </div>

          {/* Koordinat - Map Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500">Koordinat Lokasi</label>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setForm((f) => ({
                          ...f,
                          latitude: String(position.coords.latitude),
                          longitude: String(position.coords.longitude),
                        }));
                      },
                      () => {
                        setError("Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.");
                      },
                    );
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Gunakan Lokasi Saat Ini
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="z-0 w-full h-60 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <LocationPickerMap
                    initialLocation={{
                      lat: form.latitude ? parseFloat(form.latitude) : -8.7963,
                      lng: form.longitude ? parseFloat(form.longitude) : 115.1765,
                    }}
                    onChange={(loc) =>
                      setForm((f) => ({
                        ...f,
                        latitude: String(loc.lat),
                        longitude: String(loc.lng),
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  Klik atau geser pin pada peta untuk menentukan titik koordinat yang tepat.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Latitude</p>
                    <p className="text-xs font-mono text-slate-600 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                      {form.latitude || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Longitude</p>
                    <p className="text-xs font-mono text-slate-600 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                      {form.longitude || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : data.latitude && data.longitude ? (
              <div className="space-y-3">
                <div className="z-0 w-full h-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 pointer-events-none">
                  <LocationPickerMap
                    initialLocation={{
                      lat: data.latitude,
                      lng: data.longitude,
                    }}
                    onChange={() => {}}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Latitude</p>
                    <p className="text-sm text-slate-700 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 font-mono">{data.latitude}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Longitude</p>
                    <p className="text-sm text-slate-700 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 font-mono">{data.longitude}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 italic">Koordinat belum ditentukan.</span>
              </p>
            )}
          </div>
        </div>
      </div>


      {/* Info tambahan (read-only) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <Settings className="w-5 h-5 text-slate-400" />
          <h2 className="font-bold text-slate-900 text-sm">Info Sistem</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Status Sub Toko</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
              data.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}>
              {data.status ?? "tidak diketahui"}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Tanggal Dibuat</p>
            <p className="text-sm text-slate-700 font-medium">
              {data.tgl_dibuat
                ? new Date(data.tgl_dibuat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit action bar */}
      {editing && (
        <div className="sticky bottom-4 bg-white border border-slate-200 rounded-2xl shadow-xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </p>
            )}
            {!error && (
              <p className="text-xs text-slate-400">Perubahan belum disimpan.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
