"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Package,
  Bell,
  Ticket,
  PencilLine,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "../logout-button";
import { SwitchRoleButton } from "../switch-role-button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  {
    name: "Akun Saya",
    href: "/user/account/profile",
    icon: User,
    color: "text-blue-500",
    subItems: [
      { name: "Profil", href: "/user/account/profile" },
      { name: "Alamat", href: "/user/account/address" },
      { name: "Ubah Password", href: "/user/account/password" },
    ],
  },
  {
    name: "Pesanan Saya",
    href: "/user/purchase",
    icon: Package,
    color: "text-primary-600",
  },
  {
    name: "Notifikasi",
    href: "/user/notifications/order",
    icon: Bell,
    color: "text-orange-500",
    subItems: [
      { name: "Status Pesanan", href: "/user/notifications/order" },
      { name: "Promosi", href: "/user/notifications/promotion" },
      { name: "Info", href: "/user/notifications/info" },
    ],
  },
  {
    name: "Voucher Saya",
    href: "/user/voucher",
    icon: Ticket,
    color: "text-primary-600",
  },
  // {
  //   name: "Chat Toko",
  //   href: "#chat",
  //   icon: MessageSquare,
  //   color: "text-primary-500",
  // },
  {
    name: "Bantuan & Chat Admin",
    href: "/user/bantuan",
    icon: MessageSquare,
    color: "text-emerald-500",
  },
  // { name: "Koin ProkerMart", href: "/user/coins", icon: Coins, color: "text-yellow-500" },
];

export function UserSidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [profile, setProfile] = useState({
    name: "Loading...",
    foto: "https://placehold.co/100x100?text=User",
  });
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);

  useEffect(() => {
    async function fetchSidebarProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: pengguna } = await supabase
          .from("pengguna")
          .select("nama, foto_profil")
          .eq("id_pengguna", user.id)
          .single();

        if (pengguna) {
          setProfile({
            name: pengguna.nama || "User",
            foto:
              pengguna.foto_profil || "https://placehold.co/100x100?text=User",
          });
        }

        const { count } = await supabase
          .from("notifikasi")
          .select("*", { count: "exact", head: true })
          .eq("id_pengguna", user.id)
          .eq("status_dibaca", false);
        setHasUnreadNotif((count ?? 0) > 0);
      }
    }
    fetchSidebarProfile();
  }, [supabase]);

  return (
    <aside className="w-48 shrink-0 hidden md:block">
      {/* Profile Summary */}
      <div className="flex items-center gap-3 py-4 border-b border-slate-100 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden border border-slate-100 relative shrink-0">
          <Image
            src={profile.foto}
            fill
            alt="Profile"
            className="object-cover"
            unoptimized
            loading="eager"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-slate-800 truncate">
            {profile.name}
          </h3>
          <Link
            href="/user/account/profile"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600"
          >
            <PencilLine className="w-3 h-3 shrink-0" />
            <span className="truncate">Ubah Profil</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-between h-[calc(70svh)] w-fit">
        {/* Menu List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.subItems &&
                item.subItems.some((sub) => pathname === sub.href));

            return (
              <div key={item.name} className="space-y-1">
                {item.href === "#chat" ? (
                  <button
                    onClick={() =>
                      window.dispatchEvent(new Event("openGlobalChat"))
                    }
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-800 hover:text-primary-600"
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    {item.name}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive && !item.subItems
                        ? "text-primary-600"
                        : "text-slate-800 hover:text-primary-600"
                    }`}
                  >
                    <div className="relative">
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-primary-600" : item.color}`}
                      />
                      {item.name === "Notifikasi" && hasUnreadNotif && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                        </span>
                      )}
                    </div>
                    {item.name}
                  </Link>
                )}

                {/* Sub Menu */}
                {item.subItems && (
                  <div className="pl-10 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`block py-1.5 text-xs font-medium transition-colors ${
                            isSubActive
                              ? "text-primary-600"
                              : "text-slate-500 hover:text-primary-600"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <SwitchRoleButton
            currentRoute="/explore"
            className="flex w-full bg-white items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left"
          />
          <LogoutButton className="flex w-full bg-white items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left" />
        </div>
      </div>
    </aside>
  );
}
