import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
export const Route = createFileRoute("/transactions")({ component: () => (
  <div className="mx-auto max-w-2xl px-6 py-16 text-center glass-strong rounded-3xl mt-10 mx-4">
    <Receipt className="mx-auto h-10 w-10 text-primary" />
    <h1 className="mt-4 font-display text-2xl font-semibold">Transactions</h1>
    <p className="mt-2 text-sm text-muted-foreground">Riwayat transaksi coin akan muncul di sini.</p>
  </div>
)});
