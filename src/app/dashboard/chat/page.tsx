"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, MessageSquare, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";
import { motion } from "framer-motion";

type ChatToko = {
  id: string;
  id_sub_toko: string;
  id_pembeli: string;
  created_at: string;
  updated_at: string;
  pengguna: { nama: string } | null;
  lastMessage?: string;
};

type PesanToko = {
  id: string;
  id_chat: string;
  id_pengirim: string;
  isi: string;
  is_from_toko: boolean;
  created_at: string;
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardChatPage() {
  const supabase = createClient();
  const { active } = useDashboard();

  const [userId, setUserId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<ChatToko[]>([]);
  const [selected, setSelected] = useState<ChatToko | null>(null);
  const [pesanList, setPesanList] = useState<PesanToko[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const fetchChats = useCallback(async () => {
    if (!active?.id_sub_toko) return;
    try {
      const { data, error } = await supabase
        .from("chat_toko")
        .select("*, pengguna(nama)")
        .eq("id_sub_toko", active.id_sub_toko)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const chatsWithLastMsg = await Promise.all(
        (data ?? []).map(async (chat) => {
          const { data: msgs } = await supabase
            .from("pesan_toko")
            .select("isi")
            .eq("id_chat", chat.id)
            .order("created_at", { ascending: false })
            .limit(1);
          return { ...chat, lastMessage: msgs?.[0]?.isi ?? "" };
        })
      );

      setChatList(chatsWithLastMsg);
    } catch (err) {
      console.error("[DashboardChat - FetchChats] Error:", err);
    }
  }, [active?.id_sub_toko, supabase]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await fetchChats();
      setIsLoading(false);
    }
    init();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchChats, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchChats]);

  const openChat = useCallback(async (chat: ChatToko) => {
    setSelected(chat);
    setMobileView("chat");
    setIsChatLoading(true);
    try {
      const { data, error } = await supabase
        .from("pesan_toko")
        .select("*")
        .eq("id_chat", chat.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPesanList(data ?? []);
    } catch (err) {
      console.error("[DashboardChat - OpenChat] Error:", err);
    } finally {
      setIsChatLoading(false);
    }

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`pesan-toko-dash-${chat.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pesan_toko", filter: `id_chat=eq.${chat.id}` },
        (payload) => {
          setPesanList((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as PesanToko];
          });
        }
      )
      .subscribe();
    channelRef.current = ch;
  }, [supabase]);

  useEffect(() => {
    if (pesanList.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [pesanList]);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [supabase]);

  const handleSend = async () => {
    if (!inputText.trim() || !selected || !userId || isSending) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      const { error } = await supabase.from("pesan_toko").insert({
        id_chat: selected.id,
        id_pengirim: userId,
        isi: text,
        is_from_toko: true,
      });
      if (error) throw error;
    } catch (err) {
      console.error("[DashboardChat - SendMessage] Error:", err);
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <MessageSquare className="w-10 h-10 opacity-20" />
        <p className="text-sm">Pilih sub-toko terlebih dahulu</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100svh-128px)] flex gap-4">
      {/* Mobile: list view */}
      <div className={`flex-col w-full md:hidden ${mobileView === "list" ? "flex" : "hidden"}`}>
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-xl border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm">
            Chat Pembeli — {active.nama_proker}
          </h2>
        </div>
        <ChatList chatList={chatList} selected={selected} onSelect={openChat} />
      </div>

      <div className={`flex-col flex-1 md:hidden ${mobileView === "chat" ? "flex" : "hidden"}`}>
        {selected ? (
          <ChatView
            chat={selected}
            pesanList={pesanList}
            userId={userId ?? ""}
            inputText={inputText}
            setInputText={setInputText}
            onSend={handleSend}
            isSending={isSending}
            isLoading={isChatLoading}
            onBack={() => setMobileView("list")}
            bottomRef={bottomRef}
          />
        ) : null}
      </div>

      {/* Desktop: two-panel */}
      <div className="hidden md:flex gap-4 w-full h-full">
        <div className="w-80 shrink-0 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Chat Pembeli</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{active.nama_proker}</p>
            </div>
          </div>
          <ChatList chatList={chatList} selected={selected} onSelect={openChat} />
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
          {selected ? (
            <ChatView
              chat={selected}
              pesanList={pesanList}
              userId={userId ?? ""}
              inputText={inputText}
              setInputText={setInputText}
              onSend={handleSend}
              isSending={isSending}
              isLoading={isChatLoading}
              bottomRef={bottomRef}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm">Pilih percakapan dari daftar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatList({
  chatList,
  selected,
  onSelect,
}: {
  chatList: ChatToko[];
  selected: ChatToko | null;
  onSelect: (c: ChatToko) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
      {chatList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 p-8 text-center">
          <MessageSquare className="w-10 h-10 opacity-30" />
          <p className="text-sm">Belum ada pembeli yang chat</p>
        </div>
      ) : (
        chatList.map((chat) => (
          <motion.button
            key={chat.id}
            onClick={() => onSelect(chat)}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === chat.id ? "bg-primary-50" : ""}`}
          >
            <p className="text-sm font-semibold text-slate-800 truncate">
              {(chat.pengguna as { nama: string } | null)?.nama ?? "Pembeli"}
            </p>
            {chat.lastMessage && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">{formatTime(chat.updated_at)}</p>
          </motion.button>
        ))
      )}
    </div>
  );
}

function ChatView({
  chat,
  pesanList,
  userId,
  inputText,
  setInputText,
  onSend,
  isSending,
  isLoading,
  onBack,
  bottomRef,
}: {
  chat: ChatToko;
  pesanList: PesanToko[];
  userId: string;
  inputText: string;
  setInputText: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
  isLoading: boolean;
  onBack?: () => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">
            {(chat.pengguna as { nama: string } | null)?.nama ?? "Pembeli"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : pesanList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Belum ada pesan
          </div>
        ) : (
          pesanList.map((m) => {
            const isOwn = m.is_from_toko;
            return (
              <div key={m.id} className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <span className="text-[10px] text-slate-400 font-semibold px-1">Pembeli</span>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? "bg-primary-600 text-white rounded-tr-sm"
                      : "bg-white text-slate-700 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {m.isi}
                </div>
                <span className="text-[10px] text-slate-400 px-1">{formatTime(m.created_at)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 px-4 py-3 border-t border-slate-100 bg-white shrink-0">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
          placeholder="Balas pesan pembeli..."
          rows={1}
          className="flex-1 resize-none text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary-400 transition-colors max-h-28 overflow-y-auto"
        />
        <button
          onClick={onSend}
          disabled={!inputText.trim() || isSending}
          className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
