/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ExportPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportPurchaseModal({ isOpen, onClose }: ExportPurchaseModalProps) {
  // Setup default dates: from 1st of current month to today
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [isExporting, setIsExporting] = useState<"pdf" | "csv" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi");

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("pesanan")
        .select(`
          id_pesanan,
          tgl_pesan,
          total_harga,
          status_pesanan,
          sub_toko ( nama_proker ),
          detail_pesanan (
            jumlah,
            harga_satuan,
            produk ( nama_produk )
          )
        `)
        .eq("id_pengguna", user.id)
        .gte("tgl_pesan", start.toISOString())
        .lte("tgl_pesan", end.toISOString())
        .order("tgl_pesan", { ascending: false });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error("[ExportPurchaseModal] Error:", err);
      setError(err.message || "Gagal mengambil data pesanan.");
      return null;
    }
  };

  const formatDataForExport = (data: any[]) => {
    const rows: any[] = [];
    data.forEach((p) => {
      const tanggal = format(new Date(p.tgl_pesan), "dd MMM yyyy HH:mm", { locale: id });
      const toko = p.sub_toko?.nama_proker || "Toko Tidak Diketahui";
      const status = p.status_pesanan.replace(/_/g, " ").toUpperCase();
      const totalHarga = `Rp ${Number(p.total_harga).toLocaleString("id-ID")}`;

      if (p.detail_pesanan && p.detail_pesanan.length > 0) {
        p.detail_pesanan.forEach((d: any, index: number) => {
          const produk = d.produk?.nama_produk || "Produk Dihapus";
          const hargaSatuan = `Rp ${Number(d.harga_satuan).toLocaleString("id-ID")}`;
          
          rows.push({
            "ID Pesanan": index === 0 ? p.id_pesanan.split("-")[0] : "", // Hanya tampilkan ID di baris pertama item
            "Tanggal": index === 0 ? tanggal : "",
            "Toko": index === 0 ? toko : "",
            "Status": index === 0 ? status : "",
            "Nama Produk": produk,
            "Harga Satuan": hargaSatuan,
            "Jumlah": d.jumlah,
            "Total Harga": index === 0 ? totalHarga : "",
          });
        });
      } else {
        // Fallback jika tidak ada detail pesanan (jarang terjadi)
        rows.push({
          "ID Pesanan": p.id_pesanan.split("-")[0],
          "Tanggal": tanggal,
          "Toko": toko,
          "Status": status,
          "Nama Produk": "—",
          "Harga Satuan": "—",
          "Jumlah": "—",
          "Total Harga": totalHarga,
        });
      }
    });
    return rows;
  };

  const handleExportCSV = async () => {
    setIsExporting("csv");
    setError(null);
    const data = await fetchExportData();
    
    if (data && data.length > 0) {
      const rows = formatDataForExport(data);
      const headers = Object.keys(rows[0]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          headers.map(header => {
            const cell = row[header] === null ? "" : String(row[header]);
            return `"${cell.replace(/"/g, '""')}"`;
          }).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Riwayat_Pesanan_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();
    } else if (data && data.length === 0) {
      setError("Tidak ada data pesanan pada rentang tanggal ini.");
    }
    setIsExporting(null);
  };

  const handleExportExcel = async () => {
    setIsExporting("excel");
    setError(null);
    try {
      const data = await fetchExportData();
      if (data && data.length > 0) {
        const rows = formatDataForExport(data);
        const XLSX = await import("xlsx");
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Pesanan");
        XLSX.writeFile(workbook, `Riwayat_Pesanan_${startDate}_to_${endDate}.xlsx`);
        onClose();
      } else if (data && data.length === 0) {
        setError("Tidak ada data pesanan pada rentang tanggal ini.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal membuat file Excel.");
    }
    setIsExporting(null);
  };

  const handleExportPDF = async () => {
    setIsExporting("pdf");
    setError(null);
    try {
      const data = await fetchExportData();
      if (data && data.length > 0) {
        const rows = formatDataForExport(data);
        const headers = Object.keys(rows[0]);
        const body = rows.map(row => headers.map(h => row[h]));

        const jsPDF = (await import("jspdf")).default;
        const autoTable = (await import("jspdf-autotable")).default;

        const doc = new jsPDF({ orientation: "landscape" });
        
        doc.setFontSize(16);
        doc.text("Laporan Riwayat Pesanan Pembeli", 14, 15);
        doc.setFontSize(10);
        doc.text(`Periode: ${format(new Date(startDate), "dd MMM yyyy", { locale: id })} - ${format(new Date(endDate), "dd MMM yyyy", { locale: id })}`, 14, 22);

        autoTable(doc, {
          startY: 28,
          head: [headers],
          body: body,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [14, 165, 233] }, // primary-500 color
          theme: 'striped'
        });

        doc.save(`Riwayat_Pesanan_${startDate}_to_${endDate}.pdf`);
        onClose();
      } else if (data && data.length === 0) {
        setError("Tidak ada data pesanan pada rentang tanggal ini.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal membuat file PDF.");
    }
    setIsExporting(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-110 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="overflow-hidden bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Export Riwayat Pesanan</h2>
                <button
                  onClick={onClose}
                  className="p-2 transition-colors rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-600 rounded-lg bg-red-50">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting !== null}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 font-medium transition-colors border rounded-xl text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                  >
                    {isExporting === "pdf" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                    Export sebagai PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting !== null}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 font-medium transition-colors border rounded-xl text-slate-700 border-slate-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-50"
                  >
                    {isExporting === "excel" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                    Export sebagai Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={isExporting !== null}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 font-medium transition-colors border rounded-xl text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50"
                  >
                    {isExporting === "csv" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Export sebagai CSV
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
