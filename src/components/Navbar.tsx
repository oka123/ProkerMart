"use client";

import Link from "next/link";
import { ShoppingCart, Search, User, Menu, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { MobileHeader } from "./MobileHeader";

interface NavbarProps {
  variant?: "default" | "cart";
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       userMenuRef.current &&
  //       !userMenuRef.current.contains(event.target as Node)
  //     ) {
  //       setIsUserMenuOpen(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (variant === "cart") {
    return (
      <>
        {/* Desktop Header */}
        <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo />
                <h1 className="text-xl font-medium text-primary-600 pl-4 border-l border-slate-200">
                  Keranjang Saya
                </h1>
              </div>
              <div className="flex-1 max-w-xl mx-8">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Borong Produk Proker Favoritmu!"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-primary-600 focus:bg-white transition-all"
                  />
                  <button className="absolute right-0 top-0 bottom-0 px-4 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Header */}
        <MobileHeader title="Keranjang Saya" backHref="/" rightActions={[]} />
      </>
    );
  }

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-md"
          : "bg-white border-b border-slate-200 shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/explore"
              className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
            >
              Eksplor
            </Link>
            <Link
              href="/organizations"
              className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
            >
              Organisasi
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/cart"
              className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-secondary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                2
              </span>
            </Link>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>

            {/* Profile Dropdown */}
            <div
              ref={userMenuRef}
              className="relative"
              // onMouseEnter={() => setIsUserMenuOpen(true)}
              // onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <Link
                href="/user"
                className="block p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors cursor-pointer"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Menu User
                      </p>
                    </div>
                    <Link
                      href="/user"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Akun Saya
                    </Link>
                    <Link
                      href="/user/purchase"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Pesanan Saya
                    </Link>
                    <div className="h-px bg-slate-50 my-1"></div>
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-500 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 rotate-180" />
                      Keluar
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence> */}
            </div>

            {/* Direct Login Link */}
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
            >
              Masuk
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-1">
            <Link
              href="/cart"
              className="p-2 text-slate-500 active:text-primary-600 relative"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-secondary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                2
              </span>
            </Link>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openProkerChat"))
              }
              className="p-2 text-slate-500 active:text-primary-600 relative"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                9
              </span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-primary-600 rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 bg-white shadow-xl"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link
                href="/user"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-primary-600 active:bg-primary-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                Akun Saya
              </Link>
              <div className="h-px bg-slate-100 my-2 mx-2"></div>
              <Link
                href="/explore"
                className="block px-4 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Produk
              </Link>
              <Link
                href="/organizations"
                className="block px-4 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Organisasi
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
