/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChatWindow } from "./ChatWindow";

interface Contact {
  id: string; // id_chat (chat_toko.id)
  id_sub_toko: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  type: string;
}

interface ChatPopupProps {
  user: any;
  supabase: any;
}

export function ChatPopup({ user, supabase }: ChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch contacts list using chat_toko and pesan_toko
  const fetchContacts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chat_toko")
        .select(
          `
          id,
          id_sub_toko,
          updated_at,
          sub_toko (
            nama_proker,
            toko (
              nama_toko
            )
          )
        `,
        )
        .eq("id_pembeli", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const rooms = await Promise.all(
          data.map(async (chat: any) => {
            const { data: msgs } = await supabase
              .from("pesan_toko")
              .select("isi, created_at")
              .eq("id_chat", chat.id)
              .order("created_at", { ascending: false })
              .limit(1);

            const name = chat.sub_toko?.nama_proker || "Toko";
            const org = chat.sub_toko?.toko?.nama_toko || "Ormawa";
            const lastMsg = msgs?.[0]?.isi || "Belum ada pesan";
            const time = msgs?.[0]?.created_at
              ? new Date(msgs[0].created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return {
              id: chat.id,
              id_sub_toko: chat.id_sub_toko,
              name: `${name} (${org})`,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
              lastMessage: lastMsg,
              time: time,
              unreadCount: 0,
              isOnline: true,
              type: "sub_toko",
            };
          }),
        );
        setContacts(rooms);
      }
    } catch (err) {
      console.error("[ChatPopup - fetchContacts] Error:", err);
    }
  }, [user, supabase]);

  // Fetch contacts on mount/user load
  useEffect(() => {
    if (user) {
      const init = async () => {
        await Promise.resolve();
        fetchContacts();
      };
      init();
    }
  }, [user, fetchContacts]);

  // Refresh contact list when going back to list or opening popup
  useEffect(() => {
    if (view === "list" && isOpen && user) {
      const init = async () => {
        await Promise.resolve();
        fetchContacts();
      };
      init();
    }
  }, [view, isOpen, user, fetchContacts]);

  // Listen to openGlobalChat event
  useEffect(() => {
    const handleOpenGlobalChat = () => setIsOpen(true);
    window.addEventListener("openGlobalChat", handleOpenGlobalChat);
    return () => window.removeEventListener("openGlobalChat", handleOpenGlobalChat);
  }, []);

  // Listen to openProkerChat event (sent from product pages or purchase pages)
  useEffect(() => {
    const handleOpenChat = async (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsOpen(true);

      if (customEvent.detail && customEvent.detail.id_sub_toko) {
        const { id_sub_toko, name, avatar } = customEvent.detail;
        let room = contacts.find((c) => c.id_sub_toko === id_sub_toko);

        if (!room) {
          try {
            // First check if chat room already exists in database
            const { data: existingChat } = await supabase
              .from("chat_toko")
              .select(
                `
                id,
                id_sub_toko,
                sub_toko (
                  nama_proker,
                  toko (
                    nama_toko
                  )
                )
              `,
              )
              .eq("id_sub_toko", id_sub_toko)
              .eq("id_pembeli", user.id)
              .single();

            if (existingChat) {
              const rName =
                existingChat.sub_toko?.nama_proker || name || "Toko";
              const org = existingChat.sub_toko?.toko?.nama_toko || "Ormawa";
              room = {
                id: existingChat.id,
                id_sub_toko: existingChat.id_sub_toko,
                name: `${rName} (${org})`,
                avatar:
                  avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${rName}`,
                lastMessage: "Belum ada pesan",
                time: "Baru saja",
                unreadCount: 0,
                isOnline: true,
                type: "sub_toko",
              };
              setContacts((prev) => [room!, ...prev]);
            } else {
              // Create new chat room
              const { data: newChat, error: insertError } = await supabase
                .from("chat_toko")
                .insert({ id_sub_toko, id_pembeli: user.id })
                .select(
                  `
                  id,
                  id_sub_toko,
                  sub_toko (
                    nama_proker,
                    toko (
                      nama_toko
                    )
                  )
                `,
                )
                .single();

              if (!insertError && newChat) {
                const rName = newChat.sub_toko?.nama_proker || name || "Toko";
                const org = newChat.sub_toko?.toko?.nama_toko || "Ormawa";
                room = {
                  id: newChat.id,
                  id_sub_toko,
                  name: `${rName} (${org})`,
                  avatar:
                    avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${rName}`,
                  lastMessage: "Belum ada pesan",
                  time: "Baru saja",
                  unreadCount: 0,
                  isOnline: true,
                  type: "sub_toko",
                };
                setContacts((prev) => [room!, ...prev]);
              }
            }
          } catch (err) {
            console.error("[ChatPopup - handleOpenChat] Error:", err);
          }
        }

        if (room) {
          setSelectedContact(room);
          setView("chat");
        }
      }
    };

    window.addEventListener("openProkerChat", handleOpenChat);
    return () => window.removeEventListener("openProkerChat", handleOpenChat);
  }, [user, contacts, supabase]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setView("chat");
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* Floating Toggle Button */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed z-101 bg-white shadow-2xl flex flex-col inset-0 lg:inset-auto lg:bottom-4 lg:right-4 lg:w-100 lg:h-150 lg:rounded-2xl border border-slate-100 overflow-hidden"
          >
            {view === "chat" && selectedContact ? (
              <ChatWindow
                contact={selectedContact}
                onBack={() => setView("list")}
                onClose={() => setIsOpen(false)}
                user={user}
                supabase={supabase}
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                {/* List Header */}
                <div className="bg-primary-600 text-white p-4 flex items-center justify-between shadow-md shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">Chat ProkerMart</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 bg-white border-b border-slate-100 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari percakapan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-black! w-full bg-slate-100 border-none rounded-full pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary-600 outline-none"
                    />
                  </div>
                </div>

                {/* Contacts List Feed */}
                <div className="flex-1 overflow-y-auto overscroll-none divide-y divide-slate-50">
                  {filteredContacts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      Belum ada obrolan
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">
                              {contact.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {contact.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {contact.lastMessage}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
