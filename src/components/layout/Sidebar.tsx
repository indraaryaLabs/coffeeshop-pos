"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  BarChart3,
  Settings,
  Coffee,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Kasir (POS)", icon: ShoppingCart, href: "/pos" },
  { label: "Inventaris", icon: Boxes, href: "/inventory" },
  { label: "Laporan", icon: BarChart3, href: "/reports" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const [imgError, setImgError] = useState(false);
  const mounted = useIsMounted();

  const user = session?.user;
  const userName = user?.name || "User";
  const userRole = user?.role ?? "barista";
  const userImage = user?.image;
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Map role to display label
  const roleDisplayMap: Record<string, string> = {
    admin: "Administrator",
    barista: "Barista",
  };
  const roleLabel = roleDisplayMap[userRole] || userRole;

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Gagal keluar");
        },
      },
    });
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-sidebar flex flex-col py-6 z-50">
      {/* Brand */}
      <div className="px-8 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-widest uppercase font-headline">
              The Atelier
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
              Modern Barista POS
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                isActive
                  ? "text-foreground font-bold bg-sidebar-accent/20 rounded-r-full mr-4"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className="font-headline text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="px-6 mb-4">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-200"
          >
            <div className="w-6 h-6 flex items-center justify-center relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.3 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.3 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                  className="text-muted-foreground absolute"
                >
                  {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-sm font-medium text-muted-foreground font-headline">
              {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            </span>
          </button>
        )}
      </div>

      {/* User Profile — reads from Better Auth session */}
      <div className="px-6 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-destructive/10 group transition-all duration-200 border border-transparent hover:border-destructive/20 active:scale-95"
          title="Keluar"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden relative border border-border">
              {userImage && !imgError ? (
                <Image
                  unoptimized
                  src={userImage}
                  alt={userName}
                  fill
                  className="object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-sm font-headline font-bold text-muted-foreground">
                  {userInitials}
                </span>
              )}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-sm font-bold truncate text-foreground group-hover:text-destructive transition-colors max-w-[120px]">
                {userName}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {roleLabel}
              </p>
            </div>
          </div>
          <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </button>
      </div>
    </aside>
  );
}
