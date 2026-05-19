import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, Heart, MessageCircle, BookOpen, Crown, Star, Plus, Coins } from "lucide-react";
import { toast } from "sonner";
import { fetchStoryBySlug, fetchChapters } from "@/lib/queries";
import { formatNumber } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/story/$slug")({
  component: StoryDetail,
});

function StoryDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();

  const storyQ = useQuery({
    queryKey: ["story", slug],
    queryFn: async () => {
      const s = await fetchStoryBySlug(slug);
      if (!s) throw notFound();
      return s;
    },
  });
  const chaptersQ = useQuery({
    queryKey: ["chapters", storyQ.data?.id],
    queryFn: () => fetchChapters(storyQ.data!.id),
    enabled: !!storyQ.data?.id,
  });

  if (storyQ.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          <div className="skeleton aspect-[3/4] rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-10 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (storyQ.isError || !storyQ.data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Cerita tidak ditemukan.</p>
        <Link to="/explore" className="mt-4 inline-block text-primary">Kembali ke Explore</Link>
      </div>
    );
  }

  const story = storyQ.data;
  const guard = (label: string) => () => {
    if (!user) {
      toast.error(`Login dulu untuk ${label}.`);
      return;
    }
    toast.info("Fitur ini akan aktif di fase berikutnya.");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Medium cover */}
        <div
          className="aspect-[3/4] rounded-2xl shadow-warm overflow-hidden relative"
          style={{ background: story.cover_gradient ?? "var(--gradient-warm)" }}
        >
          <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
            <div className="flex gap-2">
              {story.is_vip && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vip text-white text-[10px] font-bold uppercase tracking-wider">
                  <Crown className="h-3 w-3" /> VIP
                </span>
              )}
              {!story.is_vip && story.is_premium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold text-foreground text-[10px] font-bold uppercase tracking-wider">
                  Premium
                </span>
              )}
            </div>
            <div className="drop-shadow-lg">
              <p className="text-[10px] uppercase tracking-widest opacity-80">{story.genre}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">{story.title}</h2>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-medium">{story.genre}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold leading-tight">{story.title}</h1>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center font-semibold">
              {story.author_avatar ?? story.author_name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm">{story.author_name}</p>
              <button onClick={guard("follow author")} className="text-xs text-primary hover:underline">+ Follow</button>
            </div>
          </div>

          {story.synopsis && (
            <p className="mt-6 text-muted-foreground leading-relaxed">{story.synopsis}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> {formatNumber(story.views)} views</span>
            <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4" /> {formatNumber(story.likes_count)} likes</span>
            <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {formatNumber(story.comments_count)} comments</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4" /> {formatNumber(story.favorite_count)} favorites</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const first = chaptersQ.data?.[0];
                if (first) toast.success(`Buka: ${first.title}`);
                else toast.info("Belum ada chapter tersedia.");
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow hover:shadow-warm transition-all"
            >
              <BookOpen className="h-4 w-4" /> Read Now
            </button>
            <button onClick={guard("favorite")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-strong text-sm hover:bg-accent/50">
              <Heart className="h-4 w-4" /> Favorite
            </button>
            <button onClick={guard("library")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-strong text-sm hover:bg-accent/50">
              <Plus className="h-4 w-4" /> Library
            </button>
            <button onClick={guard("donate")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-strong text-sm hover:bg-accent/50">
              <Coins className="h-4 w-4" /> Donate
            </button>
          </div>
        </div>
      </motion.div>

      {/* Chapters */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold mb-4">Chapters</h2>
        {chaptersQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : !chaptersQ.data?.length ? (
          <p className="text-muted-foreground glass rounded-xl p-6 text-sm">Belum ada chapter.</p>
        ) : (
          <ul className="space-y-2">
            {chaptersQ.data.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => toast.info(`"${c.title}" — reader mode akan dibuka di fase berikutnya.`)}
                  className="w-full text-left glass rounded-xl p-4 hover:bg-accent/40 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{c.order_index}. {c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.word_count} kata · {formatNumber(c.reader_count)} pembaca</p>
                  </div>
                  {c.is_premium && <Crown className="h-4 w-4 text-gold" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
