/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Notification {
  id_notifikasi: string;
  judul: string;
  konten: string;
  tgl_kirim: string;
  status_dibaca: boolean;
}

export default function DashboardNotifikasiPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data } = await supabase
          .from("notifikasi")
          .select("*")
          .eq("id_pengguna", user.id)
          .order("tgl_kirim", { ascending: false })
          .limit(20);

        if (data) setNotifications(data);
      } catch (error) {
        console.error("[DashboardNotifikasi - fetchNotifs] Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifs();
  }, [router, supabase]);

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifikasi")
        .update({ status_dibaca: true, tgl_baca: new Date().toISOString() })
        .eq("id_pengguna", user.id)
        .eq("status_dibaca", false);
      setNotifications(notifications.map((n) => ({ ...n, status_dibaca: true })));
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifikasi")
      .update({ status_dibaca: true, tgl_baca: new Date().toISOString() })
      .eq("id_notifikasi", id);
    setNotifications(
      notifications.map((n) => (n.id_notifikasi === id ? { ...n, status_dibaca: true } : n)),
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.status_dibaca).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Tidak ada notifikasi.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((notif) => (
              <div
                key={notif.id_notifikasi}
                onClick={() => !notif.status_dibaca && markAsRead(notif.id_notifikasi)}
                className={`flex gap-4 p-5 transition-colors cursor-pointer hover:bg-slate-50 ${
                  !notif.status_dibaca ? "bg-blue-50/40" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 shrink-0">
                  <Bell className={`w-5 h-5 ${!notif.status_dibaca ? "text-primary-600" : "text-slate-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-medium ${!notif.status_dibaca ? "text-slate-900" : "text-slate-700"}`}>
                      {notif.judul}
                    </h3>
                    {!notif.status_dibaca && (
                      <span className="w-2 h-2 mt-1 rounded-full bg-primary-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.konten}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {new Date(notif.tgl_kirim).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
