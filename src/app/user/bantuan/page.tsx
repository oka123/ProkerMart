"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, MessageSquare, Plus, Send, X, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileHeader } from "@/components/MobileHeader";
import { UserSidebar } from "@/components/user/UserSidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Percakapan = {
  id: string;
  judul: string;
  kategori: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Pesan = {
  id: string;
  id_percakapan: string;
  id_pengirim: string | null;
  isi: string;
  is_admin: boolean;
  created_at: string;
};

const KATEGORI_OPTIONS = [
  { value: "pembatalan", label: "Pembatalan Pesanan" },
  { value: "bantuan", label: "Bantuan Umum" },
  { value: "laporan", label: "Laporan" },
  { value: "kendala", label: "Kendala Teknis" },
  { value: "lainnya", label: "Lainnya" },
];

const KATEGORI_LABEL: Record<string, string> = {
  pembatalan: "Pembatalan Pesanan",
  bantuan: "Bantuan Umum",
  laporan: "Laporan",
  kendala: "Kendala Teknis",
  lainnya: "Lainnya",
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

function KategoriBadge({ kategori }: { kategori: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
      {KATEGORI_LABEL[kategori] ?? kategori}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        status === "aktif"
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {status === "aktif" ? "Aktif" : "Selesai"}
    </span>
  );
}

export default function BantuanPageWrapper() {
  return (
    <Suspense fallback={null}>
      <BantuanPage />
    </Suspense>
  );
}

function BantuanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [percakapanList, setPercakapanList] = useState<Percakapan[]>([]);
  const [selected, setSelected] = useState<Percakapan | null>(null);
  const [pesanList, setPesanList] = useState<Pesan[]>([]);
  const [inputText, setInputText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalJudul, setModalJudul] = useState("");
  const [modalKategori, setModalKategori] = useState("bantuan");
  const [modalPesan, setModalPesan] = useState("");
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
        await fetchPercakapan(user.id);

        // Auto-create & open chat from query params (e.g. from purchase page)
        const autoKategori = searchParams.get("kategori");
        const autoJudul = searchParams.get("judul");
        const autoPesan = searchParams.get("pesan");
        if (autoKategori && autoJudul && autoPesan) {
          const { data: newConv, error: convErr } = await supabase
            .from("percakapan")
            .insert({ judul: autoJudul, kategori: autoKategori, status: "aktif", id_pengguna: user.id, role_konteks: "pembeli" })
            .select()
            .single();
          if (!convErr && newConv) {
            await supabase.from("pesan_chat").insert({ id_percakapan: newConv.id, id_pengirim: user.id, isi: autoPesan, is_admin: false });
            await fetchPercakapan(user.id);
            // openChat will be called after state is set — use a small delay
            setTimeout(() => openChat(newConv), 100);
          }
        }
      } catch (err) {
        console.error("[Bantuan - Init] Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const fetchPercakapan = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("percakapan")
        .select("*")
        .eq("id_pengguna", uid)
        .eq("role_konteks", "pembeli")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setPercakapanList(data ?? []);
    } catch (err) {
      console.error("[Bantuan - FetchPercakapan] Error:", err);
    }
  };

  const openChat = useCallback(async (p: Percakapan) => {
    setSelected(p);
    setIsChatLoading(true);
    try {
      const { data, error } = await supabase
        .from("pesan_chat")
        .select("*")
        .eq("id_percakapan", p.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPesanList(data ?? []);
    } catch (err) {
      console.error("[Bantuan - OpenChat] Error:", err);
    } finally {
      setIsChatLoading(false);
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const ch = supabase
      .channel(`pesan-${p.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pesan_chat", filter: `id_percakapan=eq.${p.id}` },
        (payload) => {
          setPesanList((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Pesan];
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
    if (selected.status === "selesai") return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      const { error } = await supabase.from("pesan_chat").insert({
        id_percakapan: selected.id,
        id_pengirim: userId,
        isi: text,
        is_admin: false,
      });
      if (error) throw error;
    } catch (err) {
      console.error("[Bantuan - SendMessage] Error:", err);
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreatePercakapan = async () => {
    if (!modalJudul.trim() || !modalPesan.trim() || !userId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: newConv, error: convErr } = await supabase
        .from("percakapan")
        .insert({
          judul: modalJudul.trim(),
          kategori: modalKategori,
          status: "aktif",
          id_pengguna: userId,
          role_konteks: "pembeli",
        })
        .select()
        .single();
      if (convErr) throw convErr;

      const { error: msgErr } = await supabase.from("pesan_chat").insert({
        id_percakapan: newConv.id,
        id_pengirim: userId,
        isi: modalPesan.trim(),
        is_admin: false,
      });
      if (msgErr) throw msgErr;

      setShowModal(false);
      setModalJudul("");
      setModalKategori("bantuan");
      setModalPesan("");
      await fetchPercakapan(userId);
      await openChat(newConv);
    } catch (err) {
      console.error("[Bantuan - CreatePercakapan] Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="hidden lg:flex items-center gap-2 mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>Halaman ini untuk chat dukungan dengan admin. Untuk chat dengan toko, buka <a href="/user/chat" className="font-semibold underline">Chat Toko</a>.</span>
        </div>
        <div className="lg:flex lg:gap-6 h-full">
          <aside className="hidden lg:block shrink-0">
            <UserSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            {/* Mobile: single panel toggle */}
            <div className="lg:hidden h-[calc(100svh-0px)] flex flex-col">
              {selected ? (
                <ChatView
                  percakapan={selected}
                  pesanList={pesanList}
                  inputText={inputText}
                  setInputText={setInputText}
                  onSend={handleSend}
                  isSending={isSending}
                  isLoading={isChatLoading}
                  onBack={() => { setSelected(null); if (channelRef.current) supabase.removeChannel(channelRef.current); }}
                  bottomRef={bottomRef}
                />
              ) : (
                <ListViewMobile
                  percakapanList={percakapanList}
                  onSelect={openChat}
                  onNew={() => setShowModal(true)}
                />
              )}
            </div>

            {/* Desktop: two-panel */}
            <div className="hidden lg:flex gap-4 h-[calc(100svh-120px)]">
              <div className="w-80 shrink-0 bg-white rounded-sm shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h2 className="font-bold text-slate-800 text-sm">Percakapan Saya</h2>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Baru
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {percakapanList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 p-8 text-center">
                      <MessageSquare className="w-10 h-10 opacity-30" />
                      <p className="text-sm">Belum ada percakapan</p>
                    </div>
                  ) : (
                    percakapanList.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => openChat(p)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === p.id ? "bg-primary-50" : ""}`}
                      >
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.judul}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <KategoriBadge kategori={p.kategori} />
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">{formatTime(p.updated_at)}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-sm shadow-sm flex flex-col overflow-hidden">
                {selected ? (
                  <ChatView
                    percakapan={selected}
                    pesanList={pesanList}
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
                    <p className="text-sm">Pilih percakapan atau buat baru</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <CreateModal
            judul={modalJudul}
            setJudul={setModalJudul}
            kategori={modalKategori}
            setKategori={setModalKategori}
            pesan={modalPesan}
            setPesan={setModalPesan}
            onClose={() => setShowModal(false)}
            onSubmit={handleCreatePercakapan}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ListViewMobile({
  percakapanList,
  onSelect,
  onNew,
}: {
  percakapanList: Percakapan[];
  onSelect: (p: Percakapan) => void;
  onNew: () => void;
}) {
  return (
    <>
      <MobileHeader title="Bantuan Admin" backHref="/user" rightActions={[]} />
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
        <MessageSquare className="w-4 h-4 shrink-0" />
        <span>Chat dukungan dengan admin. Untuk chat toko, buka <a href="/user/chat" className="font-semibold underline">Chat Toko</a>.</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700">Percakapan Saya</span>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Percakapan Baru
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
        {percakapanList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">Belum ada percakapan</p>
            <p className="text-xs text-slate-400">Buat percakapan baru untuk memulai</p>
          </div>
        ) : (
          percakapanList.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-left px-4 py-4 active:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-semibold text-slate-800 truncate">{p.judul}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <KategoriBadge kategori={p.kategori} />
                <StatusBadge status={p.status} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">{formatTime(p.updated_at)}</p>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function ChatView({
  percakapan,
  pesanList,
  inputText,
  setInputText,
  onSend,
  isSending,
  isLoading,
  onBack,
  bottomRef,
}: {
  percakapan: Percakapan;
  pesanList: Pesan[];
  inputText: string;
  setInputText: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
  isLoading: boolean;
  onBack?: () => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isSelesai = percakapan.status === "selesai";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{percakapan.judul}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <KategoriBadge kategori={percakapan.kategori} />
            <StatusBadge status={percakapan.status} />
          </div>
        </div>
      </div>

      {isSelesai && (
        <div className="px-4 py-2 bg-slate-100 text-slate-500 text-xs text-center font-medium shrink-0">
          Percakapan ini telah diselesaikan
        </div>
      )}

      {/* Messages */}
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
          pesanList.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-0.5 ${m.is_admin ? "items-start" : "items-end"}`}
            >
              {m.is_admin && (
                <span className="text-[10px] text-slate-400 font-semibold px-1">Admin</span>
              )}
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.is_admin
                    ? "bg-white text-slate-700 rounded-tl-sm shadow-sm"
                    : "bg-primary-600 text-white rounded-tr-sm"
                }`}
              >
                {m.isi}
              </div>
              <span className="text-[10px] text-slate-400 px-1">{formatTime(m.created_at)}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isSelesai && (
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
      )}
    </div>
  );
}

function CreateModal({
  judul, setJudul, kategori, setKategori, pesan, setPesan,
  onClose, onSubmit, isSubmitting,
}: {
  judul: string; setJudul: (v: string) => void;
  kategori: string; setKategori: (v: string) => void;
  pesan: string; setPesan: (v: string) => void;
  onClose: () => void; onSubmit: () => void; isSubmitting: boolean;
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
          <h3 className="font-bold text-slate-800">Buat Percakapan Baru</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Judul</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Jelaskan masalah secara singkat"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary-400 transition-colors"
            >
              {KATEGORI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Pesan Pertama</label>
            <textarea
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              placeholder="Ceritakan masalah Anda..."
              rows={4}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary-400 transition-colors resize-none"
            />
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={!judul.trim() || !pesan.trim() || isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSubmitting ? "Membuat..." : "Buat Percakapan"}
        </button>
      </motion.div>
    </motion.div>
  );
}
