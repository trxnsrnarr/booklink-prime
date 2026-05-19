import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-card/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-display font-semibold text-gradient-warm">BookLink</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Read. Write. Earn. The modern home for story creators.
        </p>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BookLink</p>
      </div>
    </footer>
  );
}
