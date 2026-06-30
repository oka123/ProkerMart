"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, MessageSquare, Plus, Send, X, Loader2, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileHeader } from "@/components/MobileHeader";
import { UserSidebar } from "@/components/user/UserSidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ChatToko = {
  id: string;
  id_sub_toko: string;
  id_pembeli: string;
  created_at: string;
  updated_at: string;
  sub_toko: { nama_proker: string };
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

type SubTokoOption = {
  id_sub_toko: string;
  nama_proker: string;
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

export default function UserChatPageWrapper() {
  return (
    <Suspense fallback={null}>
      <UserChatPage />
    </Suspense>
  );
}

function UserChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<ChatToko[]>([]);
  const [selected, setSelected] = useState<ChatToko | null>(null);
  const [pesanList, setPesanList] = useState<PesanToko[]>([]);
  const [inputText, setInputText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [subTokoOptions, setSubTokoOptions] = useState<SubTokoOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push("/auth/login"); return; }
        setUserId(user.id);
        await fetchChats(user.id);

        const autoSubTokoId = searchParams.get("sub_toko_id");
        const autoNama = searchParams.get("nama") ?? "Toko";
        if (autoSubTokoId) {
          await handleStartChatById(user.id, autoSubTokoId, autoNama);
        }
      } catch (err) {
        console.error("[UserChat - Init] Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const fetchChats = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_toko")
        .select("*, sub_toko(nama_proker)")
        .eq("id_pembeli", uid)
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
      console.error("[UserChat - FetchChats] Error:", err);
    }
  };

  const openChat = useCallback(async (chat: ChatToko) => {
    setSelected(chat);
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
      console.error("[UserChat - OpenChat] Error:", err);
    } finally {
      setIsChatLoading(false);
    }

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`pesan-toko-${chat.id}`)
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
        is_from_toko: false,
      });
      if (error) throw error;
    } catch (err) {
      console.error("[UserChat - SendMessage] Error:", err);
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const fetchSubTokoOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("sub_toko")
        .select("id_sub_toko, nama_proker")
        .eq("status", "active");
      if (error) throw error;
      setSubTokoOptions(data ?? []);
    } catch (err) {
      console.error("[UserChat - FetchSubToko] Error:", err);
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    setSearchQuery("");
    await fetchSubTokoOptions();
  };

  const handleStartChatById = async (uid: string, subTokoId: string, nama: string) => {
    try {
      const { data: existing } = await supabase
        .from("chat_toko")
        .select("*,sub_toko(nama_proker)")
        .eq("id_sub_toko", subTokoId)
        .eq("id_pembeli", uid)
        .single();
      if (existing) { await openChat(existing); return; }

      const { data: newChat, error } = await supabase
        .from("chat_toko")
        .insert({ id_sub_toko: subTokoId, id_pembeli: uid })
        .select("*,sub_toko(nama_proker)")
        .single();
      if (error) throw error;
      await fetchChats(uid);
      await openChat(newChat);
    } catch (err) {
      console.error("[UserChat - StartChatById] Error:", err);
    }
  };

  const handleStartChat = async (subToko: SubTokoOption) => {
    if (!userId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: existing } = await supabase
        .from("chat_toko")
        .select("*,sub_toko(nama_proker)")
        .eq("id_sub_toko", subToko.id_sub_toko)
        .eq("id_pembeli", userId)
        .single();

      if (existing) {
        setShowModal(false);
        await openChat(existing);
        return;
      }

      const { data: newChat, error } = await supabase
        .from("chat_toko")
        .insert({ id_sub_toko: subToko.id_sub_toko, id_pembeli: userId })
        .select("*,sub_toko(nama_proker)")
        .single();
      if (error) throw error;

      setShowModal(false);
      await fetchChats(userId);
      await openChat(newChat);
    } catch (err) {
      console.error("[UserChat - StartChat] Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOptions = subTokoOptions.filter((s) =>
    !searchQuery || s.nama_proker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 w-full px-0 py-0 mx-auto max-w-7xl md:px-4 lg:px-8 md:py-6">
        <div className="lg:flex lg:gap-6 h-full">
          <aside className="hidden lg:block shrink-0">
            <UserSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="lg:hidden h-[calc(100svh-0px)] flex flex-col">
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
                  onBack={() => {
                    setSelected(null);
                    if (channelRef.current) supabase.removeChannel(channelRef.current);
                  }}
                  bottomRef={bottomRef}
                />
              ) : (
                <ListViewMobile
                  chatList={chatList}
                  onSelect={openChat}
                  onNew={handleOpenModal}
                />
              )}
            </div>

            <div className="hidden lg:flex gap-4 h-[calc(100svh-120px)]">
              <div className="w-80 shrink-0 bg-white rounded-sm shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h2 className="font-bold text-slate-800 text-sm">Chat Toko</h2>
                  <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Baru
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {chatList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 p-8 text-center">
                      <MessageSquare className="w-10 h-10 opacity-30" />
                      <p className="text-sm">Belum ada chat</p>
                      <p className="text-xs">Mulai chat dengan toko pilihanmu</p>
                    </div>
                  ) : (
                    chatList.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => openChat(chat)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === chat.id ? "bg-primary-50" : ""}`}
                      >
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {(chat.sub_toko as { nama_proker: string })?.nama_proker ?? "—"}
                        </p>
                        {chat.lastMessage && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{formatTime(chat.updated_at)}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-sm shadow-sm flex flex-col overflow-hidden">
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
                    <p className="text-sm">Pilih chat atau mulai percakapan baru</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <SubTokoModal
            options={filteredOptions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onClose={() => setShowModal(false)}
            onSelect={handleStartChat}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ListViewMobile({
  chatList,
  onSelect,
  onNew,
}: {
  chatList: ChatToko[];
  onSelect: (c: ChatToko) => void;
  onNew: () => void;
}) {
  return (
    <>
      <MobileHeader title="Chat Toko" backHref="/user" rightActions={[]} />
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700">Percakapan</span>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Chat Baru
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
        {chatList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">Belum ada chat</p>
            <p className="text-xs text-slate-400">Mulai chat dengan toko pilihanmu</p>
          </div>
        ) : (
          chatList.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className="w-full text-left px-4 py-4 active:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-semibold text-slate-800 truncate">
                {(chat.sub_toko as { nama_proker: string })?.nama_proker ?? "—"}
              </p>
              {chat.lastMessage && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
              )}
              <p className="text-[10px] text-slate-400 mt-1">{formatTime(chat.updated_at)}</p>
            </button>
          ))
        )}
      </div>
    </>
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
            {(chat.sub_toko as { nama_proker: string })?.nama_proker ?? "—"}
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
            Belum ada pesan. Mulai percakapan!
          </div>
        ) : (
          pesanList.map((m) => {
            const isOwn = m.id_pengirim === userId;
            return (
              <div key={m.id} className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <span className="text-[10px] text-slate-400 font-semibold px-1">Toko</span>
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
          placeholder="Tulis pesan..."
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

function SubTokoModal({
  options,
  searchQuery,
  setSearchQuery,
  onClose,
  onSelect,
  isSubmitting,
}: {
  options: SubTokoOption[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onClose: () => void;
  onSelect: (s: SubTokoOption) => void;
  isSubmitting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Mulai Chat Baru</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Cari toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
          />
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 rounded-xl border border-slate-100">
          {options.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
              Tidak ada toko ditemukan
            </div>
          ) : (
            options.map((s) => (
              <button
                key={s.id_sub_toko}
                onClick={() => onSelect(s)}
                disabled={isSubmitting}
                className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                {s.nama_proker}
              </button>
            ))
          )}
        </div>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 text-primary-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Membuka chat...
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
