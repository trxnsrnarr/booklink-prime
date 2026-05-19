import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Library, Wallet, PenLine, Info, User as UserIcon, LogOut, Settings, Receipt, BookMarked, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/write", label: "Write", icon: PenLine },
  { to: "/about", label: "About", icon: Info },
];

export function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  const initial = (profile?.display_name || profile?.username || user?.email || "U")[0]?.toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b border-border/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <BookOpen className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 blur-lg bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display text-xl font-bold text-gradient-warm">BookLink</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/40"
                activeProps={{ className: "px-3 py-2 text-sm font-medium text-foreground rounded-lg bg-accent/60" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent/50 transition-all"
                  aria-label="Account menu"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-glow">
                    {initial}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {profile?.username ?? "..."}
                  </span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 glass-strong rounded-2xl shadow-warm overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-border/60">
                          <p className="font-semibold truncate">{profile?.display_name ?? profile?.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-gold/30 to-primary/20 text-foreground font-medium">
                              {profile?.coin_balance ?? 0} coins
                            </span>
                          </div>
                        </div>
                        <div className="py-1">
                          {[
                            { to: "/profile", icon: UserIcon, label: "Profile" },
                            { to: "/wallet", icon: Wallet, label: "Wallet" },
                            { to: "/library", icon: Library, label: "Library" },
                            { to: "/my-stories", icon: BookMarked, label: "My Stories" },
                            { to: "/transactions", icon: Receipt, label: "Transactions" },
                            { to: "/settings", icon: Settings, label: "Settings" },
                          ].map((it) => (
                            <Link
                              key={it.to}
                              to={it.to}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors"
                            >
                              <it.icon className="h-4 w-4 text-muted-foreground" />
                              {it.label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-border/60 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow hover:shadow-warm transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent/50"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/60"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent/50"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
