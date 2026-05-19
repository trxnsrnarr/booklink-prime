import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Settings as Cog, BookOpen, Coins, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import type { Chapter, Story } from "@/lib/types";

export const Route = createFileRoute("/read/$chapterId")({
  component: ReaderPage,
});

type ReaderTheme = "parchment" | "sepia" | "night" | "ink";

const THEMES: { id: ReaderTheme; label: string; bg: string; fg: string; locked?: boolean }[] = [
  { id: "parchment", label: "Parchment", bg: "#f7efe1", fg: "#2b1f12" },
  { id: "sepia", label: "Sepia", bg: "#efe2c8", fg: "#3a2a17" },
  { id: "night", label: "Night", bg: "#0e1116", fg: "#e9e5d9" },
  { id: "ink", label: "Ink (premium)", bg: "#1a1410", fg: "#f5deb3", locked: true },
];

function loadPref<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}

function ReaderPage() {
  const { chapterId } = Route.useParams();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [fontSize, setFontSize] = useState<number>(() => loadPref("reader.fontSize", 18));
  const [lineHeight, setLineHeight] = useState<number>(() => loadPref("reader.lineHeight", 1.8));
  const [themeId, setThemeId] = useState<ReaderTheme>(() => loadPref<ReaderTheme>("reader.theme", "parchment"));
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => { localStorage.setItem("reader.fontSize", JSON.stringify(fontSize)); }, [fontSize]);
  useEffect(() => { localStorage.setItem("reader.lineHeight", JSON.stringify(lineHeight)); }, [lineHeight]);
  useEffect(() => { localStorage.setItem("reader.theme", JSON.stringify(themeId)); }, [themeId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: async () => {
      const { data: chapter, error } = await supabase.from("chapters").select("*").eq("id", chapterId).maybeSingle();
      if (error) throw error;
      if (!chapter) return null;
      const { data: story } = await supabase.from("stories").select("*").eq("id", (chapter as Chapter).story_id).maybeSingle();
      const { data: all } = await supabase.from("chapters").select("id, order_index, title").eq("story_id", (chapter as Chapter).story_id).order("order_index");
      return { chapter: chapter as Chapter, story: story as Story | null, all: (all ?? []) as { id: string; order_index: number; title: string }[] };
    },
  });

  const theme = THEMES.find((tt) => tt.id === themeId)!;
  const isLockedTheme = theme.locked;
  const activeBg = isLockedTheme ? "#f7efe1" : theme.bg;
  const activeFg = isLockedTheme ? "#2b1f12" : theme.fg;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>;
  }
  if (isError || !data?.chapter) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-muted-foreground">{t("common.notFound")}</p>
        <Link to="/explore" className="text-primary">← Explore</Link>
      </div>
    );
  }

  const { chapter, story, all } = data;
  const idx = all.findIndex((c) => c.id === chapter.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  const isPremiumLocked = chapter.is_premium && (!user || (profile?.coin_balance ?? 0) < chapter.coin_price);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: activeBg, color: activeFg, transition: "background-color .4s ease, color .4s ease" }}>
      <div className="sticky top-16 z-30 backdrop-blur-md" style={{ backgroundColor: `${activeBg}cc`, borderBottom: `1px solid ${activeFg}1a` }}>
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/story/$slug" params={{ slug: story?.slug ?? "" }} className="inline-flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> {story?.title?.slice(0, 30) ?? t("common.back")}
          </Link>
          <button onClick={() => setPanelOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border" style={{ borderColor: `${activeFg}33` }}>
            <Cog className="h-4 w-4" /> Aa
          </button>
        </div>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="sticky top-[8.25rem] z-20 mx-auto max-w-3xl px-4"
          >
            <div className="rounded-2xl p-4 shadow-lg" style={{ backgroundColor: activeBg, border: `1px solid ${activeFg}22` }}>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="flex items-center justify-between mb-1.5"><span>{t("reader.fontSize")}</span><span className="opacity-60">{fontSize}px</span></label>
                  <input type="range" min={14} max={28} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-current" />
                </div>
                <div>
                  <label className="flex items-center justify-between mb-1.5"><span>{t("reader.lineHeight")}</span><span className="opacity-60">{lineHeight.toFixed(1)}</span></label>
                  <input type="range" min={1.4} max={2.4} step={0.1} value={lineHeight} onChange={(e) => setLineHeight(+e.target.value)} className="w-full accent-current" />
                </div>
                <div>
                  <p className="mb-2">{t("reader.theme")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          if (th.locked) { toast.info("Tema premium — segera tersedia."); return; }
                          setThemeId(th.id);
                        }}
                        className={`relative rounded-xl px-3 py-2.5 text-xs font-medium border ${themeId === th.id ? "ring-2 ring-offset-2" : ""}`}
                        style={{ backgroundColor: th.bg, color: th.fg, borderColor: `${th.fg}33` }}
                      >
                        {th.label}
                        {th.locked && <Crown className="absolute top-1.5 right-1.5 h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <article className="mx-auto max-w-3xl px-5 sm:px-8 py-10">
        <p className="text-xs uppercase tracking-widest opacity-60">Chapter {chapter.order_index}</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold" style={{ color: activeFg }}>{chapter.title}</h1>

        {isPremiumLocked ? (
          <div className="mt-10 rounded-2xl p-8 text-center" style={{ border: `1px dashed ${activeFg}55` }}>
            <Lock className="mx-auto h-10 w-10 opacity-70" />
            <p className="mt-4 font-semibold">{t("reader.premium")}</p>
            <p className="mt-2 text-sm opacity-80">{t("reader.unlock", { coin: chapter.coin_price })}</p>
            <button
              onClick={() => toast.info("Unlock coin akan aktif setelah Midtrans terintegrasi.")}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2 font-medium"
              style={{ backgroundColor: activeFg, color: activeBg }}
            >
              <Coins className="h-4 w-4" /> {t("reader.unlock", { coin: chapter.coin_price })}
            </button>
          </div>
        ) : (
          <div
            className="mt-8 whitespace-pre-wrap"
            style={{ fontSize: `${fontSize}px`, lineHeight, fontFamily: "Georgia, 'Playfair Display', serif" }}
          >
            {chapter.content || "(empty)"}
          </div>
        )}

        <div className="mt-12 flex items-center justify-between gap-3 pt-6" style={{ borderTop: `1px solid ${activeFg}22` }}>
          <button
            disabled={!prev}
            onClick={() => prev && navigate({ to: "/read/$chapterId", params: { chapterId: prev.id } })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm disabled:opacity-30"
            style={{ border: `1px solid ${activeFg}33` }}
          >
            <ArrowLeft className="h-4 w-4" /> {t("reader.prev")}
          </button>
          <Link to="/story/$slug" params={{ slug: story?.slug ?? "" }} className="inline-flex items-center gap-1.5 text-sm opacity-70 hover:opacity-100">
            <BookOpen className="h-4 w-4" />
          </Link>
          <button
            disabled={!next}
            onClick={() => next && navigate({ to: "/read/$chapterId", params: { chapterId: next.id } })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm disabled:opacity-30 font-medium"
            style={{ backgroundColor: activeFg, color: activeBg }}
          >
            {t("reader.next")} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    </div>
  );
}
