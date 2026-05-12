"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Bell, Ticket, PencilLine, LogOut } from "lucide-react";
import Image from "next/image";

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
  // { name: "Koin ProkerMart", href: "/user/coins", icon: Coins, color: "text-yellow-500" },
];

export function UserSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      {/* Profile Summary */}
      <div className="flex items-center gap-3 py-4 border-b border-slate-100 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
          <Image
            src="https://placehold.co/100x100?text=User"
            width={100}
            height={100}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800">Andi123</h3>
          <Link
            href="/user/account/profile"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600"
          >
            <PencilLine className="w-3 h-3" />
            Ubah Profil
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-between h-[calc(70svh)]">
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
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive && !item.subItems
                      ? "text-primary-600"
                      : "text-slate-800 hover:text-primary-600"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-primary-600" : item.color}`}
                  />
                  {item.name}
                </Link>

                {/* Render Sub Items only if parent item is active */}
                {item.subItems && isActive && (
                  <div className="ml-9 space-y-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block py-1.5 text-sm transition-all ${
                            isSubActive
                              ? "text-primary-600 font-medium"
                              : "text-slate-600 hover:text-primary-600"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-8 pt-4 border-t border-slate-100">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-all group">
            <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
