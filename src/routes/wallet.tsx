import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Sparkles, Crown, Gift, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

const COIN_PACKS = [
  { coins: 50, price: 10000, bonus: 0 },
  { coins: 150, price: 25000, bonus: 10, popular: true },
  { coins: 350, price: 50000, bonus: 50 },
  { coins: 800, price: 100000, bonus: 200 },
];

const VIP_PLANS = [
  { name: "Monthly", price: 49000, period: "/bulan" },
  { name: "Yearly", price: 449000, period: "/tahun", best: true },
];

function WalletPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-10"><div className="skeleton h-40 rounded-2xl" /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center glass-strong rounded-3xl p-10">
        <Coins className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-semibold">{t("nav.wallet")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Login untuk mengakses wallet.</p>
        <Link to="/login" className="mt-6 inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow">{t("nav.login")}</Link>
      </div>
    );
  }

  const soon = () => toast.info("Top-up via Midtrans akan aktif setelah integrasi pembayaran.");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold">{t("nav.wallet")}</h1>
        <p className="mt-2 text-muted-foreground">Top up koin, jadi VIP, atau klaim reward.</p>

        <div className="mt-8 glass-strong rounded-3xl p-8 shadow-warm relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-gold/30 to-primary/20 blur-3xl" />
          <div className="relative grid sm:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-sm text-muted-foreground">Saldo koin</p>
              <p className="mt-2 font-display text-6xl font-bold text-gradient-warm">{profile?.coin_balance ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">BookLink Coins</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <button onClick={soon} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium shadow-glow inline-flex items-center gap-2">
                <Coins className="h-4 w-4" /> Top Up
              </button>
              <button onClick={() => toast.info("Ads reward akan aktif segera.")} className="px-5 py-2.5 rounded-full glass font-medium inline-flex items-center gap-2">
                <Gift className="h-4 w-4" /> Tonton iklan → koin
              </button>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Paket Koin</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COIN_PACKS.map((p) => (
              <button key={p.coins} onClick={soon} className={`relative glass rounded-2xl p-5 text-left hover:bg-accent/30 transition-all hover-lift ${p.popular ? "ring-2 ring-primary" : ""}`}>
                {p.popular && <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-[10px] font-bold uppercase">Popular</span>}
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-gold" />
                  <p className="font-display text-2xl font-bold">{p.coins}</p>
                </div>
                {p.bonus > 0 && <p className="text-[11px] text-primary mt-1">+{p.bonus} bonus</p>}
                <p className="mt-3 text-sm font-medium">Rp {p.price.toLocaleString("id-ID")}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><Crown className="h-5 w-5 text-vip" /> VIP Subscription</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VIP_PLANS.map((p) => (
              <button key={p.name} onClick={soon} className={`relative glass-strong rounded-2xl p-6 text-left hover-lift transition-all ${p.best ? "ring-2 ring-vip shadow-glow" : ""}`}>
                {p.best && <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-vip text-white text-[10px] font-bold uppercase">Best Value</span>}
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-vip" />
                  <p className="font-display text-xl font-semibold">{p.name}</p>
                </div>
                <p className="mt-3 font-display text-3xl font-bold">Rp {p.price.toLocaleString("id-ID")}<span className="text-sm font-normal text-muted-foreground">{p.period}</span></p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li>✓ Bebas iklan</li>
                  <li>✓ Akses semua cerita VIP</li>
                  <li>✓ Tema baca eksklusif</li>
                  <li>✓ Badge VIP di profil</li>
                </ul>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Author Earnings</h2>
          <div className="glass rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="font-display text-2xl font-bold">Rp 0</p><p className="text-xs text-muted-foreground mt-1">Saldo earning</p></div>
              <div><p className="font-display text-2xl font-bold">0</p><p className="text-xs text-muted-foreground mt-1">Total unlock</p></div>
              <div><p className="font-display text-2xl font-bold">Rp 0</p><p className="text-xs text-muted-foreground mt-1">Sudah ditarik</p></div>
            </div>
            <button onClick={soon} className="mt-5 w-full sm:w-auto px-5 py-2.5 rounded-full glass font-medium text-sm">Withdraw (segera)</button>
          </div>
        </section>

        <div className="mt-10 glass rounded-2xl p-5 text-sm text-muted-foreground flex items-center gap-2 justify-center text-center">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          Integrasi pembayaran Midtrans, withdraw, dan ads reward akan diaktifkan di fase berikutnya.
        </div>
      </motion.div>
    </div>
  );
}
