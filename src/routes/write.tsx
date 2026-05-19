import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PenLine, Sparkles } from "lucide-react";

export const Route = createFileRoute("/write")({ component: WritePage });

function WritePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-12 shadow-warm">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
          <PenLine className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-3xl sm:text-4xl font-semibold">Tulis cerita kamu</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Editor chapter modern dengan gambar inline, monetization, dan analytics akan tersedia di fase Creator (selanjutnya).
        </p>
        <div className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground glass px-4 py-2 rounded-full">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Fase Author tools — coming soon
        </div>
      </motion.div>
    </div>
  );
}
