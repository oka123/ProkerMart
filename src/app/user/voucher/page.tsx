"use client";

import { useState, useEffect } from "react";
import { Ticket, Search, Clock, Loader2, Info } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface VoucherClaim {
  id_klaim: string;
  status_pakai: boolean;
  voucher: {
    id_voucher: string;
    kode_voucher: string;
    nama_voucher: string;
    deskripsi: string;
    tipe_diskon: string;
    nilai_diskon: number;
    max_diskon: number | null;
    min_belanja: number;
    tgl_berakhir: string;
  };
}

export default function VoucherPage() {
  const router = useRouter();
  const supabase = createClient();
  const [vouchers, setVouchers] = useState<VoucherClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchVouchers = async (uid: string) => {
    const { data, error } = await supabase
      .from("voucher_pengguna")
      .select(`
        id_klaim,
        status_pakai,
        voucher (*)
      `)
      .eq("id_pengguna", uid)
      .eq("status_pakai", false);

    if (!error && data) {
      setVouchers(data as unknown as VoucherClaim[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
      fetchVouchers(user.id);
    }
    init();
  }, [router, supabase]);

  const handleClaimVoucher = async () => {
    if (!claimCode.trim()) {
      toast.error("Masukkan kode voucher terlebih dahulu!");
      return;
    }
    setIsClaiming(true);

    try {
      // Cari voucher berdasarkan kode
      const { data: voucherData, error: voucherErr } = await supabase
        .from("voucher")
        .select("*")
        .ilike("kode_voucher", claimCode.trim())
        .single();

      if (voucherErr || !voucherData) {
        throw new Error("Voucher tidak ditemukan.");
      }

      if (!voucherData.status) {
        throw new Error("Voucher tidak aktif.");
      }

      if (new Date(voucherData.tgl_berakhir) < new Date()) {
        throw new Error("Voucher sudah kedaluwarsa.");
      }

      // Claim
      const { error: claimErr } = await supabase
        .from("voucher_pengguna")
        .insert({
          id_pengguna: userId,
          id_voucher: voucherData.id_voucher,
        });

      if (claimErr) {
        if (claimErr.code === "23505") { // Unique violation
          throw new Error("Anda sudah mengklaim voucher ini.");
        }
        throw claimErr;
      }

      toast.success("Voucher berhasil ditambahkan!");
      setClaimCode("");
      fetchVouchers(userId);
    } catch (error: any) {
      toast.error(error.message || "Gagal klaim voucher.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 pb-20 lg:pb-0">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="lg:flex lg:gap-6">
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <MobileHeader
              title="Voucher Saya"
              backHref="/user/account/profile"
              rightActions={[]}
            />

            <div className="space-y-4">
              <div className="bg-white p-4 lg:p-8 lg:rounded-sm lg:shadow-sm">
                <div className="hidden lg:flex items-center justify-center gap-4  w-full">
                  <span className="text-base font-medium whitespace-nowrap">
                    Tambah Voucher
                  </span>
                  <input
                    type="text"
                    value={claimCode}
                    onChange={(e) => setClaimCode(e.target.value)}
                    placeholder="Masukkan kode voucher"
                    className="flex-1 border border-slate-200 rounded-sm px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-600 uppercase"
                  />
                  <button 
                    onClick={handleClaimVoucher}
                    disabled={isClaiming || !claimCode}
                    className="bg-primary-600 text-white px-8 py-2 rounded-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isClaiming && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan
                  </button>
                </div>

                <div className="lg:hidden flex gap-2">
                  <input
                    type="text"
                    value={claimCode}
                    onChange={(e) => setClaimCode(e.target.value)}
                    placeholder="Masukkan kode voucher..."
                    className="flex-1 border border-slate-200 rounded-sm px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 uppercase"
                  />
                  <button 
                    onClick={handleClaimVoucher}
                    disabled={isClaiming || !claimCode}
                    className="bg-primary-600 text-white p-2 rounded-sm disabled:opacity-50"
                  >
                    {isClaiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-white lg:rounded-sm lg:shadow-sm overflow-hidden min-h-100">
                <div className="p-4 lg:p-6">
                  {vouchers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Ticket className="w-16 h-16 mb-4 opacity-20" />
                      <p>Belum ada voucher yang disimpan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vouchers.map((claim) => {
                        const v = claim.voucher;
                        const isPerc = v.tipe_diskon === "persentase";
                        return (
                          <div
                            key={claim.id_klaim}
                            className="flex border border-slate-100 rounded-sm shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden h-30 lg:h-35"
                          >
                            <div className={`bg-blue-600 w-24 lg:w-32 flex flex-col items-center justify-center text-white shrink-0 relative overflow-hidden`}>
                              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-1">
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <div key={i} className="w-1 h-1 bg-[#f5f5f5] rounded-full -ml-0.5"></div>
                                ))}
                              </div>

                              <div className="z-10 flex flex-col items-center text-center px-1">
                                <div className="w-10 h-10 bg-white/20 rounded-sm flex items-center justify-center mb-1">
                                  <Ticket className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[8px] lg:text-[10px] font-bold leading-tight uppercase">
                                  PROMO
                                </span>
                                <span className="text-[7px] lg:text-[8px] mt-1 opacity-90 leading-tight">
                                  {v.kode_voucher}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 bg-white p-3 lg:p-4 flex flex-col justify-between relative">
                              <div className="space-y-1">
                                <h3 className="text-sm lg:text-base font-medium text-slate-800 line-clamp-1">
                                  {v.nama_voucher}
                                </h3>
                                <p className="text-[11px] lg:text-xs text-slate-500 line-clamp-1">
                                  {v.deskripsi}
                                </p>
                                <p className="text-[11px] lg:text-xs text-slate-500 font-medium mt-1">
                                  Min. Belanja Rp {v.min_belanja.toLocaleString('id-ID')}
                                </p>
                              </div>

                              <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-[10px] lg:text-[11px] text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span>s.d {new Date(v.tgl_berakhir).toLocaleDateString('id-ID')}</span>
                                  </div>
                                </div>
                                <button className="border border-primary-600 text-primary-600 text-[10px] lg:text-xs font-medium px-3 py-1 rounded-sm hover:bg-primary-50 transition-colors">
                                  Pakai Nanti
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
