import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Crown, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/write_/$storyId")({ component: StoryEditor });

function StoryEditor() {
  const { storyId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [coinPrice, setCoinPrice] = useState(0);

  const storyQ = useQuery({
    queryKey: ["edit-story", storyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("stories").select("*").eq("id", storyId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const chaptersQ = useQuery({
    queryKey: ["edit-chapters", storyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("chapters").select("*").eq("story_id", storyId).order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveChapter = useMutation({
    mutationFn: async () => {
      if (!chapterTitle.trim()) throw new Error("title");
      const words = chapterContent.trim().split(/\s+/).filter(Boolean).length;
      if (editingId) {
        const { error } = await supabase.from("chapters").update({
          title: chapterTitle, content: chapterContent, is_premium: isPremium, coin_price: coinPrice, word_count: words,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const order = (chaptersQ.data?.length ?? 0) + 1;
        const { error } = await supabase.from("chapters").insert({
          story_id: storyId, title: chapterTitle, content: chapterContent, order_index: order, is_premium: isPremium, coin_price: coinPrice, word_count: words,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Chapter tersimpan!");
      setEditingId(null); setChapterTitle(""); setChapterContent(""); setIsPremium(false); setCoinPrice(0);
      qc.invalidateQueries({ queryKey: ["edit-chapters", storyId] });
    },
    onError: (e: Error) => toast.error(e.message === "title" ? "Judul chapter wajib diisi." : "Gagal menyimpan."),
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Chapter dihapus."); qc.invalidateQueries({ queryKey: ["edit-chapters", storyId] }); },
  });

  const publishStory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stories").update({ status: "published" }).eq("id", storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cerita diterbitkan! 🎉");
      qc.invalidateQueries({ queryKey: ["edit-story", storyId] });
      qc.invalidateQueries({ queryKey: ["my-stories"] });
    },
  });

  if (storyQ.isLoading) return <div className="mx-auto max-w-4xl px-6 py-10"><div className="skeleton h-40 rounded-2xl" /></div>;
  if (!storyQ.data || storyQ.data.author_id !== user?.id) {
    return <div className="text-center py-20 text-muted-foreground">Akses ditolak. <Link to="/write" className="text-primary">Kembali</Link></div>;
  }

  const story = storyQ.data;
  const startEdit = (c: { id: string; title: string; content: string; is_premium: boolean; coin_price: number }) => {
    setEditingId(c.id); setChapterTitle(c.title); setChapterContent(c.content); setIsPremium(c.is_premium); setCoinPrice(c.coin_price);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => { setEditingId(null); setChapterTitle(""); setChapterContent(""); setIsPremium(false); setCoinPrice(0); };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <button onClick={() => navigate({ to: "/write" })} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6 sm:p-8 shadow-warm">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-20 w-20 rounded-2xl shrink-0" style={{ background: story.cover_gradient ?? "var(--gradient-warm)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-primary">{story.genre}</p>
            <h1 className="font-display text-3xl font-semibold truncate">{story.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{story.synopsis ?? "—"}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${story.status === "published" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{story.status}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" />{story.views}</span>
            </div>
          </div>
          {story.status !== "published" && (
            <button onClick={() => publishStory.mutate()} disabled={publishStory.isPending || !chaptersQ.data?.length} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-sm font-medium shadow-glow disabled:opacity-60">
              <Send className="h-4 w-4" /> Publish
            </button>
          )}
        </div>
      </motion.div>

      <div className="mt-8 glass-strong rounded-2xl p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">{editingId ? "Edit Chapter" : "Chapter Baru"}</h2>
        <input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="Judul chapter" className="w-full px-4 py-3 rounded-xl bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/40" />
        <textarea value={chapterContent} onChange={(e) => setChapterContent(e.target.value)} placeholder="Tulis cerita kamu di sini..." rows={12} className="w-full px-4 py-3 rounded-xl bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/40 resize-y font-serif text-base leading-relaxed" />
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
            <Crown className="h-4 w-4 text-gold" /> Chapter premium
          </label>
          {isPremium && (
            <label className="inline-flex items-center gap-2">
              Harga (koin):
              <input type="number" min={0} max={500} value={coinPrice} onChange={(e) => setCoinPrice(+e.target.value)} className="w-20 px-2 py-1 rounded-lg bg-input/60 border border-border outline-none" />
            </label>
          )}
          <div className="ml-auto flex gap-2">
            {editingId && <button onClick={cancelEdit} className="px-4 py-2 rounded-full glass text-sm">Batal</button>}
            <button onClick={() => saveChapter.mutate()} disabled={saveChapter.isPending} className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-sm font-medium disabled:opacity-60 inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> {saveChapter.isPending ? "..." : editingId ? "Update" : "Tambah"}
            </button>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold mb-4">Daftar Chapter</h2>
        <div className="space-y-2">
          {chaptersQ.isLoading ? <div className="skeleton h-14 rounded-xl" /> :
            !chaptersQ.data?.length ? <p className="glass rounded-xl p-6 text-sm text-muted-foreground text-center">Belum ada chapter.</p> :
            chaptersQ.data.map((c) => (
              <div key={c.id} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.order_index}. {c.title} {c.is_premium && <Crown className="inline h-3.5 w-3.5 text-gold ml-1" />}</p>
                  <p className="text-xs text-muted-foreground">{c.word_count} kata{c.is_premium ? ` · ${c.coin_price} koin` : ""}</p>
                </div>
                <button onClick={() => startEdit(c)} className="px-3 py-1.5 rounded-full text-xs glass hover:bg-accent/50">Edit</button>
                <button onClick={() => { if (confirm("Hapus chapter ini?")) deleteChapter.mutate(c.id); }} className="p-2 rounded-full text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          }
        </div>
      </section>
    </div>
  );
}
