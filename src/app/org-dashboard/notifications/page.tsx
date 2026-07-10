"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";
import { markAsRead, markAllAsRead } from "./actions";
import { Bell, Check, Loader2, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

type Notification = {
  id_notifikasi: string;
  judul: string;
  konten: string;
  link_terkait: string | null;
  status_dibaca: boolean;
  tgl_kirim: string;
};

export default function NotificationsPage() {
  const { org, refreshOrg } = useOrgDashboard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!org?.id_pengguna) return;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifikasi")
      .select("*")
      .eq("id_pengguna", org.id_pengguna)
      .order("tgl_kirim", { ascending: false });
      
    if (data && !error) {
      setNotifications(data);
    }
    setLoading(false);
  }, [org?.id_pengguna]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id_notifikasi: string) => {
    setMarking(id_notifikasi);
    await markAsRead(id_notifikasi);
    await fetchNotifications();
    refreshOrg(); // Update context badge
    setMarking(null);
  };

  const handleMarkAllAsRead = async () => {
    setMarking("all");
    await markAllAsRead();
    await fetchNotifications();
    refreshOrg();
    setMarking(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.status_dibaca).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pemberitahuan terbaru seputar organisasi dan toko Anda.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={marking === "all"}
            className="text-sm font-semibold text-primary-600 bg-primary-50 px-4 py-2 rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50"
          >
            {marking === "all" ? "Menandai..." : "Tandai Semua Dibaca"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Belum Ada Notifikasi
          </h3>
          <p className="text-sm text-slate-500">
            Anda akan mendapatkan pemberitahuan jika ada pesan baru.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {notifications.map((notif) => (
            <div
              key={notif.id_notifikasi}
              className={`p-6 border-b border-slate-100 last:border-0 transition-colors flex gap-4 items-start ${
                !notif.status_dibaca ? "bg-primary-50/30" : "hover:bg-slate-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                !notif.status_dibaca ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-400"
              }`}>
                <Info className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className={`font-semibold text-base ${
                    !notif.status_dibaca ? "text-slate-900" : "text-slate-700"
                  }`}>
                    {notif.judul}
                  </h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(notif.tgl_kirim), {
                      addSuffix: true,
                      locale: id
                    })}
                  </span>
                </div>
                <p className={`text-sm mb-3 ${
                  !notif.status_dibaca ? "text-slate-700" : "text-slate-500"
                }`}>
                  {notif.konten}
                </p>
                
                <div className="flex items-center justify-between gap-4">
                  {notif.link_terkait ? (
                    <Link
                      href={notif.link_terkait}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                    >
                      Lihat Detail <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : <div></div>}
                  
                  {!notif.status_dibaca && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id_notifikasi)}
                      disabled={marking === notif.id_notifikasi}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                    >
                      {marking === notif.id_notifikasi ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Tandai Dibaca
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
