import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { StoryCard, StoryCardSkeleton } from "@/components/StoryCard";
import { fetchStories } from "@/lib/queries";
import { GENRES } from "@/lib/types";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore Stories — BookLink" }] }),
  component: ExplorePage,
});

function ExplorePage() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState<"trending" | "newest" | "popular" | "premium">("trending");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["explore", genre, sort, search],
    queryFn: () => fetchStories({ genre, sort, search: search || undefined }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold">Explore</h1>
        <p className="mt-2 text-muted-foreground">Temukan cerita berikutnya yang akan kamu jatuh cintai.</p>
      </motion.div>

      <div className="mt-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul cerita..."
            className="w-full pl-11 pr-4 py-3 rounded-full glass-strong text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                genre === g.value
                  ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow"
                  : "glass hover:bg-accent/50"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { v: "trending", l: "Trending" },
            { v: "popular", l: "Popular" },
            { v: "newest", l: "Newest" },
            { v: "premium", l: "Premium" },
          ] as const).map((s) => (
            <button
              key={s.v}
              onClick={() => setSort(s.v)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                sort === s.v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {isError ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Gagal memuat cerita.</p>
            <button onClick={() => refetch()} className="mt-4 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm">
              Coba lagi
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <StoryCardSkeleton key={i} />)}
          </div>
        ) : !data?.length ? (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-muted-foreground">Tidak ada cerita yang cocok dengan filter ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
