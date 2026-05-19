import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PenLine, Plus, BookOpen, Eye, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { supabase } from "@/integrations/supabase/client";
import { GENRES } from "@/lib/types";

export const Route = createFileRoute("/write")({ component: WritePage });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || `story-${Date.now()}`;
}

function WritePage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("romance");
  const [synopsis, setSynopsis] = useState("");

  const myStoriesQ = useQuery({
    enabled: !!user,
    queryKey: ["my-stories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("author_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createStory = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (!title.trim()) throw new Error("title");
      const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase.from("stories").insert({
        author_id: user.id,
        author_name: user.email?.split("@")[0] ?? "Author",
        title: title.trim(),
        slug,
        synopsis: synopsis.trim() || null,
        genre,
        status: "draft",
        cover_gradient: "linear-gradient(135deg, #d2b48c, #a0522d)",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Cerita dibuat!");
      setTitle(""); setSynopsis(""); setShowForm(false);
      qc.invalidateQueries({ queryKey: ["my-stories"] });
    },
    onError: (e: Error) => toast.error(e.message === "title" ? "Judul wajib diisi." : "Gagal membuat cerita."),
  });

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-10"><div className="skeleton h-40 rounded-2xl" /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center glass-strong rounded-3xl p-10">
        <PenLine className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-semibold">{t("nav.write")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Login untuk mulai menulis.</p>
        <Link to="/login" className="mt-6 inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow">{t("nav.login")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold">{t("nav.write")}</h1>
          <p className="mt-2 text-muted-foreground">Kelola cerita & chapter kamu.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow">
          <Plus className="h-4 w-4" /> {t("editor.newStory")}
        </button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 glass-strong rounded-2xl p-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("editor.title")} className="w-full px-4 py-3 rounded-xl bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/40" />
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/40">
            {GENRES.filter((g) => g.value !== "all").map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder={t("editor.synopsis")} rows={3} className="w-full px-4 py-3 rounded-xl bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-full glass text-sm">{t("common.cancel")}</button>
            <button onClick={() => createStory.mutate()} disabled={createStory.isPending} className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-sm font-medium disabled:opacity-60">
              {createStory.isPending ? "..." : t("common.save")}
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-8 space-y-3">
        {myStoriesQ.isLoading ? (
          <div className="skeleton h-24 rounded-2xl" />
        ) : !myStoriesQ.data?.length ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            {t("editor.empty")}
          </div>
        ) : (
          myStoriesQ.data.map((s) => (
            <Link key={s.id} to="/write/$storyId" params={{ storyId: s.id }} className="block glass-strong rounded-2xl p-5 hover:bg-accent/30 transition-all flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl shrink-0" style={{ background: s.cover_gradient ?? "var(--gradient-warm)" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg font-semibold truncate">{s.title}</h3>
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${s.status === "published" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {s.status === "published" ? t("common.publish") : t("common.draft")}
                  </span>
                  {s.is_premium && <Crown className="h-3.5 w-3.5 text-gold" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{s.genre} · {s.synopsis ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {s.views ?? 0}</span>
                </p>
              </div>
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
