import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Coins, User as UserIcon, BookMarked, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="mx-auto max-w-3xl px-6 py-10"><div className="skeleton h-32 rounded-2xl" /></div>;
  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center glass-strong rounded-3xl p-10">
        <UserIcon className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Profil</h1>
        <p className="mt-2 text-sm text-muted-foreground">Login untuk melihat profilmu.</p>
        <Link to="/login" className="mt-6 inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow">Login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-8 shadow-warm">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-glow">
            {(profile.display_name ?? profile.username)[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold">{profile.display_name ?? profile.username}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <p className="text-xs text-muted-foreground mt-1">Bergabung {new Date(profile.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
          </div>
        </div>

        {profile.bio && <p className="mt-6 text-muted-foreground">{profile.bio}</p>}

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Coins, label: "Coins", value: profile.coin_balance },
            { icon: BookMarked, label: "Reading", value: 0 },
            { icon: Sparkles, label: "Stories", value: 0 },
            { icon: Users, label: "Followers", value: 0 },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <s.icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 font-display text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
