import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Flame, Clock, Star, Crown, ArrowRight } from "lucide-react";
import { TypingHero } from "@/components/TypingHero";
import { StoryCard, StoryCardSkeleton } from "@/components/StoryCard";
import { fetchStories } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BookLink — Tempatnya Cerita & Creator" },
      { name: "description", content: "Baca jutaan cerita romance, fantasy, horror, dan lainnya. Bergabung jadi penulis dan dapatkan penghasilan dari cerita yang kamu buat." },
    ],
  }),
  component: HomePage,
});

function Section({ title, icon: Icon, link, items, loading }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  items: import("@/lib/types").Story[] | undefined;
  loading: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-end justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">{title}</h2>
        </div>
        <Link to={link} className="text-sm text-primary hover:text-primary-glow font-medium inline-flex items-center gap-1">
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <StoryCardSkeleton key={i} />)
          : items?.slice(0, 5).map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}
      </div>
    </section>
  );
}

function HomePage() {
  const trendingQ = useQuery({ queryKey: ["stories", "trending"], queryFn: () => fetchStories({ sort: "trending", limit: 10 }) });
  const newestQ = useQuery({ queryKey: ["stories", "newest"], queryFn: () => fetchStories({ sort: "newest", limit: 10 }) });
  const popularQ = useQuery({ queryKey: ["stories", "popular"], queryFn: () => fetchStories({ sort: "popular", limit: 10 }) });
  const premiumQ = useQuery({ queryKey: ["stories", "premium"], queryFn: () => fetchStories({ sort: "premium", limit: 10 }) });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground mb-8">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Platform creator economy untuk cerita modern
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05]">
              Welcome to <br className="sm:hidden" />
              <TypingHero />
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Baca, tulis, dan dapatkan penghasilan dari cerita. Dari romance hangat hingga sci-fi mendebarkan,
              semuanya ada di sini.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/explore"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow hover:shadow-warm transition-all hover:scale-105"
              >
                Mulai Membaca
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-full glass-strong font-medium hover:bg-accent/50 transition-all"
              >
                Jadi Penulis
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Section title="Trending Now" icon={Flame} link="/explore" items={trendingQ.data} loading={trendingQ.isLoading} />
      <Section title="Recommended for You" icon={Star} link="/explore" items={popularQ.data} loading={popularQ.isLoading} />
      <Section title="Premium Stories" icon={Crown} link="/explore" items={premiumQ.data} loading={premiumQ.isLoading} />
      <Section title="Latest Releases" icon={Clock} link="/explore" items={newestQ.data} loading={newestQ.isLoading} />

      <div className="h-10" />
    </div>
  );
}
