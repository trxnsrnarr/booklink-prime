import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Sparkles, Crown, Gift, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { supabase } from "@/integrations/supabase/client";
import { createTopupTransaction } from "@/lib/midtrans.functions";
import { loadSnap, openSnap } from "@/lib/midtrans-snap";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

const VIP_PLANS = [
  { name: "Monthly", price: 49000, period: "/bulan" },
  { name: "Yearly", price: 449000, period: "/tahun", best: true },
];

interface CoinPackage {
  id: string;
  name: string;
  coin_amount: number;
  bonus_coin: number;
  price_idr: number;
  is_popular: boolean;
  sort_order: number;
}

function WalletPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const topup = useServerFn(createTopupTransaction);
  const [busyId, setBusyId] = useState<string | null>(null);

  const packagesQ = useQuery({
    queryKey: ["coin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CoinPackage[];
    },
  });

  // Realtime: refresh profile + transactions when our transactions table updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("wallet-tx-" + user.id)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus === "success") {
            toast.success("Top-up berhasil! Koin sudah masuk.");
            refreshProfile();
          }
          qc.invalidateQueries({ queryKey: ["my-transactions"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc, refreshProfile]);

  const buyPack = useMutation({
    mutationFn: async (pkg: CoinPackage) => {
      setBusyId(pkg.id);
      const res = await topup({ data: { package_id: pkg.id } });
      await loadSnap(res.client_key);
      return new Promise<void>((resolve) => {
        openSnap(res.snap_token, {
          onSuccess: () => {
            toast.success("Pembayaran berhasil! Menunggu konfirmasi...");
            resolve();
          },
          onPending: () => {
            toast.info("Pembayaran pending. Selesaikan sebelum expired.");
            resolve();
          },
          onError: () => {
            toast.error("Pembayaran gagal.");
            resolve();
          },
          onClose: () => {
            toast.message("Popup ditutup. Transaksi pending di Transactions.");
            resolve();
          },
        });
      });
    },
    onSettled: () => {
      setBusyId(null);
      qc.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold">{t("nav.wallet")}</h1>
        <p className="mt-2 text-muted-foreground">Top up koin, jadi VIP, atau klaim reward.</p>

        <div className="mt-8 glass-strong rounded-3xl p-6 sm:p-8 shadow-warm relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-gold/30 to-primary/20 blur-3xl" />
          <div className="relative grid sm:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-sm text-muted-foreground">Saldo koin</p>
              <p className="mt-2 font-display text-5xl sm:text-6xl font-bold text-gradient-warm">{profile?.coin_balance ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">BookLink Coins</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link to="/transactions" className="px-5 py-2.5 rounded-full glass font-medium inline-flex items-center gap-2 text-sm">
                Riwayat transaksi →
              </Link>
              <button onClick={() => toast.info("Ads reward akan aktif segera.")} className="px-5 py-2.5 rounded-full glass font-medium inline-flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4" /> Tonton iklan → koin
              </button>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Paket Koin</h2>
          {packagesQ.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1,2,3,4,5].map(i=><div key={i} className="skeleton h-32 rounded-2xl"/>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {packagesQ.data?.map((p) => {
                const busy = busyId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => buyPack.mutate(p)}
                    disabled={busy || buyPack.isPending}
                    className={`relative glass rounded-2xl p-4 sm:p-5 text-left hover:bg-accent/30 transition-all hover-lift disabled:opacity-60 ${p.is_popular ? "ring-2 ring-primary" : ""}`}
                  >
                    {p.is_popular && <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-[10px] font-bold uppercase">Popular</span>}
                    <p className="text-xs text-muted-foreground">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Coins className="h-5 w-5 text-gold" />
                      <p className="font-display text-2xl font-bold">{p.coin_amount}</p>
                    </div>
                    {p.bonus_coin > 0 && <p className="text-[11px] text-primary mt-0.5">+{p.bonus_coin} bonus</p>}
                    <p className="mt-3 text-sm font-semibold">Rp {p.price_idr.toLocaleString("id-ID")}</p>
                    {busy && <div className="absolute inset-0 rounded-2xl bg-background/60 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Metode: QRIS, Gopay, ShopeePay, DANA, Virtual Account, Bank Transfer.</p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><Crown className="h-5 w-5 text-vip" /> VIP Subscription</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VIP_PLANS.map((p) => (
              <button key={p.name} onClick={() => toast.info("VIP subscription akan aktif di fase berikutnya.")} className={`relative glass-strong rounded-2xl p-6 text-left hover-lift transition-all ${p.best ? "ring-2 ring-vip shadow-glow" : ""}`}>
                {p.best && <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-vip text-white text-[10px] font-bold uppercase">Best Value</span>}
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-vip" />
                  <p className="font-display text-xl font-semibold">{p.name}</p>
                </div>
                <p className="mt-3 font-display text-3xl font-bold">Rp {p.price.toLocaleString("id-ID")}<span className="text-sm font-normal text-muted-foreground">{p.period}</span></p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li>✓ Bebas iklan</li>
                  <li>✓ Diskon unlock chapter</li>
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
            <p className="mt-4 text-xs text-muted-foreground text-center">Dashboard penulis & withdraw akan aktif di Phase 4B.</p>
          </div>
        </section>

        <div className="mt-10 glass rounded-2xl p-5 text-sm text-muted-foreground flex items-center gap-2 justify-center text-center">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          Sedang mode sandbox Midtrans — gunakan kartu/VA test untuk simulasi pembayaran.
        </div>
      </motion.div>
    </div>
  );
}
