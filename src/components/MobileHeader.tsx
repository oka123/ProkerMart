"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  MessageSquare,
  Search,
  MoreVertical,
} from "lucide-react";

interface MobileHeaderProps {
  title: string;
  backHref?: string;
  showBack?: boolean;
  rightActions?: ("cart" | "chat" | "search" | "more")[];
  cartCount?: number;
  chatCount?: number;
  className?: string;
}

export function MobileHeader({
  title,
  showBack = true,
  backHref = "/",
  rightActions = ["cart", "chat"],
  cartCount = 0,
  chatCount = 0,
  className = "",
}: MobileHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 sticky top-0 z-40 lg:hidden ${className}`}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Link href={backHref}>
            <ArrowLeft className="w-6 h-6 text-primary-600" />
          </Link>
        )}
        <h1 className="text-xl font-medium text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {rightActions.map((action) => {
          if (action === "search") {
            return (
              <button key={action} className="p-1">
                <Search className="w-6 h-6 text-primary-600" />
              </button>
            );
          }
          if (action === "cart") {
            return (
              <Link key={action} href="/cart" className="relative p-1">
                <ShoppingCart className="w-6 h-6 text-primary-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          }
          if (action === "chat") {
            return (
              <button
                key={action}
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("openProkerChat"))
                }
                className="relative p-1"
              >
                <MessageSquare className="w-6 h-6 text-primary-600" />
                {chatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {chatCount}
                  </span>
                )}
              </button>
            );
          }
          if (action === "more") {
            return (
              <button key={action} className="p-1">
                <MoreVertical className="w-6 h-6 text-primary-600" />
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
