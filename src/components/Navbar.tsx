"use client";

import Link from "next/link";
import { ShoppingCart, Search, User, Menu } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                ProkerMart
              </span>
            </Link>
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
            <button className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative">
              <Link
                href="/cart"
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 block"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>

              <span className="absolute top-0 right-0 w-4 h-4 bg-secondary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                2
              </span>
            </button>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
            >
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <User className="w-4 h-4" />
              </div>
              <span>Masuk</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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
            className="md:hidden border-t border-slate-200 bg-white"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <Link
                href="/explore"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-primary-50"
              >
                Eksplor
              </Link>
              <Link
                href="/organizations"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-primary-50"
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
