/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Paperclip,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  senderName?: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface Contact {
  id: string; // id_room
  id_sub_toko: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  type: string;
  isPanitiaView?: boolean;
}

export function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  useEffect(() => {
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
  }, [supabase]);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data: userData } = await supabase.from('pengguna').select('role').eq('id_pengguna', user.id).single();
    const role = userData?.role || 'pembeli';

    let rooms: Contact[] = [];

    if (role === 'pembeli') {
      const { data: rawRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id_room,
          id_sub_toko,
          sub_toko (
            nama_proker,
            toko (
              nama_toko
            )
          )
        `)
        .eq('id_pembeli', user.id);

      if (rawRooms) {
        rooms = rawRooms.map((r: any) => {
          const name = r.sub_toko?.nama_proker || "Toko";
          const org = r.sub_toko?.toko?.nama_toko || "Ormawa";
          
          return {
            id: r.id_room,
            id_sub_toko: r.id_sub_toko,
            name: `${name} (${org})`,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
            lastMessage: "",
            time: "",
            unreadCount: 0,
            isOnline: true,
            type: "sub_toko"
          };
        });
      }
    } else {
      // Panitia / Proker view
      const { data: rawRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id_room,
          id_sub_toko,
          pengguna (nama),
          chat_messages (pesan, created_at)
        `)
        .order('created_at', { referencedTable: 'chat_messages', ascending: true });
        
      rooms = (rawRooms || []).map((r: any) => {
        const msgs = r.chat_messages || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const buyer = Array.isArray(r.pengguna) ? r.pengguna[0] : r.pengguna;

        return {
          id: r.id_room,
          id_sub_toko: r.id_sub_toko,
          name: buyer?.nama || "Pembeli",
          avatar: `https://placehold.co/100x100?text=${encodeURIComponent(buyer?.nama?.charAt(0) || 'P')}`,
          lastMessage: lastMsg ? lastMsg.pesan : "Belum ada pesan",
          time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "",
          unreadCount: 0,
          isOnline: true,
          type: "pembeli",
          isPanitiaView: true
        };
      });
    }

    setContacts(rooms);
  }, [supabase, user]);

  // Fetch Contacts
  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      fetchContacts();
    });
  }, [user, fetchContacts]);

  // Listen for global open event
  useEffect(() => {
    const handleOpenChat = async (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsOpen(true);
      if (customEvent.detail && customEvent.detail.id_sub_toko) {
        const { id_sub_toko, name, type, avatar } = customEvent.detail;
        
        let room = contacts.find(c => c.id_sub_toko === id_sub_toko);
        
        if (!room) {
          // Buat room baru
          const { data: newRoom, error } = await supabase
            .from('chat_rooms')
            .insert({ id_pembeli: user?.id, id_sub_toko })
            .select()
            .single();
            
          if (!error && newRoom) {
            room = {
              id: newRoom.id_room,
              id_sub_toko,
              name,
              avatar: avatar || `https://placehold.co/100x100?text=${encodeURIComponent(name?.charAt(0) || 'T')}`,
              lastMessage: "Belum ada pesan",
              time: "Baru saja",
              unreadCount: 0,
              isOnline: true,
              type: type || "toko",
            };
            setContacts(prev => [room!, ...prev]);
          } else if (error && error.code === '23505') {
            // Already exists
            const { data: existingRoom } = await supabase
              .from('chat_rooms')
              .select('id_room')
              .eq('id_pembeli', user?.id)
              .eq('id_sub_toko', id_sub_toko)
              .single();
              
            if (existingRoom) {
               room = {
                  id: existingRoom.id_room,
                  id_sub_toko,
                  name,
                  avatar: avatar || `https://placehold.co/100x100?text=${encodeURIComponent(name?.charAt(0) || 'T')}`,
                  lastMessage: "Belum ada pesan",
                  time: "Baru saja",
                  unreadCount: 0,
                  isOnline: true,
                  type: type || "toko",
               };
               setContacts(prev => [room!, ...prev]);
            }
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

  // Load Messages and Subscription
  useEffect(() => {
    if (!selectedContact || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, pengguna(nama, role)')
        .eq('id_room', selectedContact.id)
        .order('created_at', { ascending: true });
      
      if (data) {
        const msgs = data.map((m: any) => {
          const userObj = Array.isArray(m.pengguna) ? m.pengguna[0] : m.pengguna;
          return {
            id: m.id_message,
            text: m.pesan,
            sender: (m.id_pengirim === user.id ? "me" : "them") as "me" | "them",
            senderName: m.id_pengirim !== user.id && userObj?.role === 'proker' ? userObj.nama : undefined,
            timestamp: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            status: "read" as "sent" | "delivered" | "read"
          };
        });
        setMessages(msgs);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`room:${selectedContact.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `id_room=eq.${selectedContact.id}` },
        async (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.id_pengirim === user.id) {
             // Will be added locally by handleSendMessage, or handled here if from another device
             // To prevent duplicates, we can check if it exists
             setMessages((prev) => {
               if (prev.find(m => m.id === newMsg.id_message)) return prev;
               return [...prev, {
                  id: newMsg.id_message,
                  text: newMsg.pesan,
                  sender: "me" as "me" | "them",
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  status: "sent" as "sent" | "delivered" | "read"
               }];
             });
          } else {
             const {data: senderData} = await supabase.from('pengguna').select('nama, role').eq('id_pengguna', newMsg.id_pengirim).single();
             setMessages((prev) => [...prev, {
                id: newMsg.id_message,
                text: newMsg.pesan,
                sender: "them" as "me" | "them",
                senderName: senderData?.role === 'proker' ? senderData.nama : undefined,
                timestamp: new Date(newMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                status: "read" as "sent" | "delivered" | "read"
             }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact, user, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view, isOpen]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setView("chat");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !user) return;
    
    const textToSend = newMessage.trim();
    setNewMessage("");

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      text: textToSend,
      sender: "me" as "me" | "them",
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: "sent" as "sent" | "delivered" | "read"
    }]);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        id_room: selectedContact.id,
        id_pengirim: user.id,
        pesan: textToSend,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === tempId ? {
        id: data.id_message,
        text: data.pesan,
        sender: "me" as "me" | "them",
        timestamp: new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        status: "delivered" as "sent" | "delivered" | "read"
      } : m));
    }
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
                !
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
            className={`fixed z-101 bg-white shadow-2xl flex flex-col
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
                      <h3 className="font-semibold text-sm leading-tight truncate max-w-48">
                        {selectedContact.name}
                      </h3>
                      <span className="text-[10px] opacity-80">
                        Online
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
                      {contacts.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">Belum ada obrolan</div>
                      ) : (
                        contacts.map((contact) => (
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
                        ))
                      )}
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
                      {messages.map((msg) => (
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
                            {msg.senderName && (
                              <p className="text-[10px] font-bold text-primary-600 mb-1">{msg.senderName}</p>
                            )}
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
                                handleSendMessage(e as any);
                              }
                            }}
                          />
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
