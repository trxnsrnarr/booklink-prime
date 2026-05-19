import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/transactions")({ component: TxPage });

function TxPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-semibold flex items-center gap-3"><Receipt className="h-8 w-8 text-primary" /> Transactions</h1>
        <p className="mt-2 text-muted-foreground">Riwayat top-up, unlock chapter, dan withdraw.</p>
      </motion.div>
      <div className="mt-8 glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Belum ada transaksi. Riwayat akan otomatis muncul setelah top-up Midtrans aktif.
      </div>
    </div>
  );
}
