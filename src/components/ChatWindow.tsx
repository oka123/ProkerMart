/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Check, CheckCheck, Paperclip, X } from "lucide-react";
import Image from "next/image";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  senderName?: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface ChatWindowProps {
  contact: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  onBack: () => void;
  onClose: () => void;
  user: any;
  supabase: any;
}

export function ChatWindow({ contact, onBack, onClose, user, supabase }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages from pesan_toko
  useEffect(() => {
    if (!contact.id || !user) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("pesan_toko")
          .select("*, pengguna!id_pengirim(nama, role)")
          .eq("id_chat", contact.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data) {
          const msgs = data.map((m: any) => {
            const isOwn = m.id_pengirim === user.id;
            return {
              id: m.id,
              text: m.isi,
              sender: (isOwn ? "me" : "them") as "me" | "them",
              senderName: !isOwn && m.is_from_toko ? m.pengguna?.nama : undefined,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "read" as "sent" | "delivered" | "read",
            };
          });
          setMessages(msgs);
        }
      } catch (err) {
        console.error("[ChatWindow - fetchMessages] Error:", err);
      }
    };

    fetchMessages();

    // Subscribe to realtime changes in pesan_toko
    const channel = supabase
      .channel(`pesan-toko-popup-${contact.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pesan_toko",
          filter: `id_chat=eq.${contact.id}`,
        },
        async (payload: any) => {
          const newMsg = payload.new as any;
          const isOwn = newMsg.id_pengirim === user.id;

          if (isOwn) {
            // Check if already in list to avoid duplicates
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [
                ...prev,
                {
                  id: newMsg.id,
                  text: newMsg.isi,
                  sender: "me" as "me" | "them",
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  status: "sent" as "sent" | "delivered" | "read",
                },
              ];
            });
          } else {
            let senderName = undefined;
            if (newMsg.is_from_toko) {
              try {
                const { data: senderData } = await supabase
                  .from("pengguna")
                  .select("nama")
                  .eq("id_pengguna", newMsg.id_pengirim)
                  .single();
                senderName = senderData?.nama;
              } catch (err) {
                console.error("[ChatWindow - getSenderName] Error:", err);
              }
            }

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [
                ...prev,
                {
                  id: newMsg.id,
                  text: newMsg.isi,
                  sender: "them" as "me" | "them",
                  senderName: senderName,
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  status: "read" as "sent" | "delivered" | "read",
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contact.id, user, supabase]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !contact.id || !user) return;

    const textToSend = newMessage.trim();
    setNewMessage("");

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: textToSend,
        sender: "me" as "me" | "them",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent" as "sent" | "delivered" | "read",
      },
    ]);

    try {
      const { data, error } = await supabase
        .from("pesan_toko")
        .insert({
          id_chat: contact.id,
          id_pengirim: user.id,
          isi: textToSend,
          is_from_toko: false,
        })
        .select(`
          *,
          pengguna!id_pengirim(nama, role)
        `)
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: data.id,
                  text: data.isi,
                  sender: "me" as "me" | "them",
                  timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  status: "delivered" as "sent" | "delivered" | "read",
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error("[ChatWindow - handleSendMessage] Error:", err);
      // Revert/show error or allow retry
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header Info */}
      <div className="bg-primary-600 text-white p-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={contact.avatar}
                alt="Avatar"
                width={40}
                height={40}
                className="rounded-full border border-white/30"
              />
              {contact.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary-600 rounded-full" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight truncate max-w-48">
                {contact.name}
              </h3>
              <span className="text-[10px] opacity-80">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
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
              className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm relative group ${
                msg.sender === "me"
                  ? "bg-primary-600 text-white rounded-tr-none"
                  : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
              }`}
            >
              {msg.senderName && (
                <p className="text-[10px] font-bold text-primary-600 mb-1">
                  {msg.senderName}
                </p>
              )}
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <div className="flex items-center gap-1 mt-1 justify-end opacity-70">
                <span className="text-[9px]">{msg.timestamp}</span>
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

      {/* Message Input */}
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
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all flex items-center justify-center shrink-0 ${
              newMessage.trim()
                ? "bg-primary-600 text-white shadow-lg hover:bg-primary-700 active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-default"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
