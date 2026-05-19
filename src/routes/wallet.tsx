import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

function WalletPage() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="mx-auto max-w-3xl px-6 py-10"><div className="skeleton h-40 rounded-2xl" /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center glass-strong rounded-3xl p-10">
        <Coins className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Wallet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Login untuk mengakses wallet.</p>
        <Link to="/login" className="mt-6 inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow">Login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-semibold">Wallet</h1>
        <p className="mt-2 text-muted-foreground">Kelola coin dan transaksi kamu.</p>

        <div className="mt-8 glass-strong rounded-3xl p-8 shadow-warm relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-gold/30 to-primary/20 blur-3xl" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Saldo coin</p>
            <p className="mt-2 font-display text-6xl font-bold text-gradient-warm">
              {profile?.coin_balance ?? 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">BookLink Coins</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow opacity-70 cursor-not-allowed">
                Top Up (segera)
              </button>
              <button className="px-5 py-2.5 rounded-full glass font-medium opacity-70 cursor-not-allowed">
                Tonton iklan → coin
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 glass rounded-2xl p-6 text-center text-sm text-muted-foreground inline-flex items-center gap-2 w-full justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
          Top-up via Midtrans, ads reward, dan VIP subscription akan aktif di fase berikutnya.
        </div>
      </motion.div>
    </div>
  );
}
