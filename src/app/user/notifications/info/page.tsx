/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Notification {
  id_notifikasi: string;
  judul: string;
  konten: string;
  tgl_kirim: string;
  status_dibaca: boolean;
}

export default function InfoNotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
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
        .order("tgl_kirim", { ascending: false });

      if (data) {
        // Filter info (not pesanan/promo)

        const infoNotifs = data.filter((n: any) => {
          const t = n.judul.toLowerCase();
          return (
            !t.includes("pesan") &&
            !t.includes("promo") &&
            !t.includes("diskon")
          );
        });
        setNotifications(infoNotifs);
      }
      setIsLoading(false);
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
      setNotifications(
        notifications.map((n) => ({ ...n, status_dibaca: true })),
      );
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifikasi")
      .update({ status_dibaca: true, tgl_baca: new Date().toISOString() })
      .eq("id_notifikasi", id);
    setNotifications(
      notifications.map((n) =>
        n.id_notifikasi === id ? { ...n, status_dibaca: true } : n,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 w-full px-0 py-0 mx-auto max-w-7xl md:px-4 lg:px-8 md:py-6">
        <div className="lg:flex lg:gap-6">
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <MobileHeader
              title="Notifikasi Info"
              backHref="/user"
              rightActions={[]}
            />

            <div className="flex bg-white border-b lg:hidden border-slate-50">
              <Link
                href="/user/notifications/order"
                className="flex-1 py-3 text-sm font-medium text-center text-slate-500"
              >
                Pesanan
              </Link>
              <Link
                href="/user/notifications/promotion"
                className="flex-1 py-3 text-sm font-medium text-center text-slate-500"
              >
                Promosi
              </Link>
              <Link
                href="/user/notifications/info"
                className="flex-1 py-3 text-sm font-medium text-center border-b-2 border-primary-600 text-primary-600"
              >
                Info
              </Link>
            </div>

            <div className="lg:bg-white lg:shadow-sm lg:rounded-sm">
              <div className="justify-end hidden p-4 border-b lg:flex border-slate-50">
                <button
                  onClick={markAllAsRead}
                  className="text-sm transition-colors text-slate-500 hover:text-primary-600"
                >
                  Tandai sebagai sudah dibaca
                </button>
              </div>

              <div className="divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Tidak ada notifikasi Info.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id_notifikasi}
                      onClick={() =>
                        !notif.status_dibaca && markAsRead(notif.id_notifikasi)
                      }
                      className={`flex flex-col lg:flex-row gap-4 p-4 lg:p-6 transition-colors hover:bg-slate-50/50 cursor-pointer ${!notif.status_dibaca ? "bg-orange-50/30" : "bg-white"}`}
                    >
                      <div className="flex items-center justify-center w-12 h-12 overflow-hidden border rounded-lg lg:w-16 lg:h-16 bg-slate-100 shrink-0 border-slate-100">
                        <Info className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-3 lg:justify-start">
                          <h3 className="text-sm font-medium lg:text-base text-slate-900">
                            {notif.judul}
                          </h3>
                        </div>
                        <p className="text-xs leading-relaxed lg:text-sm text-slate-500">
                          {notif.konten}
                        </p>
                        <p className="text-[11px] lg:text-xs text-slate-400 mt-2">
                          {new Date(notif.tgl_kirim).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
