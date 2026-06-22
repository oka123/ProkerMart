"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Image as ImageIcon,
  Smile,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Store,
  ShieldCheck,
  Paperclip,
  Phone,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: number;
  text: string;
  sender: "me" | "them";
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface Contact {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  type: "organisasi" | "toko" | "admin";
}

const mockContacts: Contact[] = [
  {
    id: 1,
    name: "HIMAIF - Organisasi",
    avatar: "https://placehold.co/100x100?text=HIMAIF",
    lastMessage: "Halo kak, stok kaos masih ada?",
    time: "10:30",
    unreadCount: 2,
    isOnline: true,
    type: "organisasi",
  },
  {
    id: 2,
    name: "Risol Mayo Kedai",
    avatar: "https://placehold.co/100x100?text=Risol",
    lastMessage: "Pesanan kakak sedang kami siapkan ya.",
    time: "Kemarin",
    unreadCount: 0,
    isOnline: false,
    type: "toko",
  },
  {
    id: 3,
    name: "Admin ProkerMart",
    avatar: "https://placehold.co/100x100?text=Admin",
    lastMessage: "Terima kasih telah menghubungi kami.",
    time: "2 Hari lalu",
    unreadCount: 0,
    isOnline: true,
    type: "admin",
  },
  {
    id: 4,
    name: "HIMAIF - Organisasi 2",
    avatar: "https://placehold.co/100x100?text=HIMAIF",
    lastMessage: "Halo kak, stok kaos masih ada?",
    time: "10:30",
    unreadCount: 2,
    isOnline: true,
    type: "organisasi",
  },
  {
    id: 5,
    name: "Risol Mayo Kedai 2",
    avatar: "https://placehold.co/100x100?text=Risol",
    lastMessage: "Pesanan kakak sedang kami siapkan ya.",
    time: "Kemarin",
    unreadCount: 0,
    isOnline: false,
    type: "toko",
  },
  {
    id: 6,
    name: "Admin ProkerMart 2",
    avatar: "https://placehold.co/100x100?text=Admin",
    lastMessage: "Terima kasih telah menghubungi kami.",
    time: "2 Hari lalu",
    unreadCount: 0,
    isOnline: true,
    type: "admin",
  },
  {
    id: 7,
    name: "Admin ProkerMart 3",
    avatar: "https://placehold.co/100x100?text=Admin",
    lastMessage: "Terima kasih telah menghubungi kami.",
    time: "2 Hari lalu",
    unreadCount: 0,
    isOnline: true,
    type: "admin",
  },
];

const mockMessages: Message[] = [
  {
    id: 1,
    text: "Halo kak, selamat siang!",
    sender: "them",
    timestamp: "10:00",
    status: "read",
  },
  {
    id: 2,
    text: "Siang kak, saya mau tanya soal merchandise Invention.",
    sender: "me",
    timestamp: "10:05",
    status: "read",
  },
  {
    id: 3,
    text: "Tentu kak, mau tanya bagian mananya?",
    sender: "them",
    timestamp: "10:06",
    status: "read",
  },
  {
    id: 4,
    text: "Apakah stok kaos yang ukuran XL masih tersedia?",
    sender: "me",
    timestamp: "10:10",
    status: "delivered",
  },
  {
    id: 5,
    text: "Halo kak, stok kaos masih ada",
    sender: "them",
    timestamp: "10:30",
    status: "sent",
  },
  {
    id: 6,
    text: "Silahkan diorder",
    sender: "them",
    timestamp: "10:30",
    status: "sent",
  },
];

export function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for global open event
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("openProkerChat", handleOpenChat);
    return () => window.removeEventListener("openProkerChat", handleOpenChat);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedContact, view, isOpen]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setView("chat");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setNewMessage("");
  };

  if (loading || !user) return null;

  return (
    <>
      {/* Floating Toggle Button (Desktop Only) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex fixed bottom-12 right-8 w-14 h-14 bg-primary-600 text-white rounded-full shadow-2xl items-center justify-center hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all z-100 group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="msg"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-3 -right-3 bg-secondary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full border-2 border-primary-600 flex items-center justify-center">
                9
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-101 bg-white shadow-2xl  flex flex-col
              ${/* Responsive Logic */ ""}
              inset-0 lg:inset-auto lg:bottom-0 lg:right-0 lg:w-100 lg:h-150 lg:rounded-2xl border border-slate-100
            `}
          >
            {/* --- HEADER --- */}
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                {view === "chat" && (
                  <button
                    onClick={() => setView("list")}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                {view === "chat" && selectedContact ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Image
                        src={selectedContact.avatar}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="rounded-full border border-white/30"
                      />
                      {selectedContact.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary-600 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">
                        {selectedContact.name}
                      </h3>
                      <span className="text-[10px] opacity-80">
                        {selectedContact.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">Chat ProkerMart</h3>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {view === "chat" && (
                  <>
                    <button className="hover:bg-white/20 p-1.5 rounded-full transition-colors hidden md:block">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="hover:bg-white/20 p-1.5 rounded-full transition-colors hidden md:block">
                      <Video className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* --- BODY --- */}
            <div className="flex-1 flex flex-col bg-slate-50/50 min-h-0">
              <AnimatePresence mode="wait">
                {view === "list" ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    {/* Search Bar */}
                    <div className="p-3 bg-white border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari percakapan..."
                          className="w-full text-black! bg-slate-100 border-none rounded-full pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary-600"
                        />
                      </div>
                    </div>

                    {/* Contacts List */}
                    <div className="flex-1 overflow-y-auto overscroll-none divide-y divide-slate-50">
                      {mockContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => handleSelectContact(contact)}
                          className="w-full flex items-center gap-3 p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="relative shrink-0">
                            <Image
                              src={contact.avatar}
                              alt={contact.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                            {contact.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className="font-semibold text-sm text-slate-900 truncate flex items-center gap-1">
                                {contact.name}
                                {contact.type === "admin" && (
                                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                                )}
                                {contact.type === "toko" && (
                                  <Store className="w-3 h-3 text-orange-500" />
                                )}
                              </h4>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {contact.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {contact.lastMessage}
                            </p>
                          </div>
                          {contact.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                              {contact.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    {/* Messages Area */}
                    <div
                      ref={scrollRef}
                      className="flex-1 p-4 space-y-4 overflow-y-auto overscroll-none"
                    >
                      <div className="text-center py-2">
                        <span className="text-[10px] bg-slate-200/50 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
                          Hari Ini
                        </span>
                      </div>

                      {mockMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm relative group
                            ${
                              msg.sender === "me"
                                ? "bg-primary-600 text-white rounded-tr-none"
                                : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                            }
                          `}
                          >
                            <p className="text-sm leading-relaxed">
                              {msg.text}
                            </p>
                            <div
                              className={`flex items-center gap-1 mt-1 justify-end opacity-70`}
                            >
                              <span className="text-[9px]">
                                {msg.timestamp}
                              </span>
                              {msg.sender === "me" && (
                                <span className="text-[10px]">
                                  {msg.status === "read" ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="bg-white border-t border-slate-100 p-3 shrink-0">
                      <div className="flex items-end gap-2">
                        <div className="flex gap-1 mb-1.5">
                          <button className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors hidden sm:block">
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-1">
                          <textarea
                            rows={1}
                            placeholder="Ketik pesan..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="text-black! flex-1 bg-transparent border-none outline-none text-sm py-2 focus:ring-0 resize-none max-h-32"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                          />
                          <button className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors">
                            <Smile className="w-5 h-5" />
                          </button>
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className={`p-3 rounded-full transition-all flex items-center justify-center shrink-0
                            ${
                              newMessage.trim()
                                ? "bg-primary-600 text-white shadow-lg hover:bg-primary-700 active:scale-95"
                                : "bg-slate-100 text-slate-400 cursor-default"
                            }
                          `}
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
