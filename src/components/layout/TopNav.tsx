"use client";

import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Bell, Settings, LogOut, UserCircle2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children?: React.ReactNode;
}

export function TopNav({
  title,
  subtitle,
  searchPlaceholder = "Cari transaksi...",
  searchQuery,
  onSearchChange,
  children,
}: TopNavProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const userName = user?.name || "User";
  const userRole = user?.role ?? "barista";

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Berhasil keluar");
          router.push("/login");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Gagal keluar");
        },
      },
    });
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-background/80 backdrop-blur-md z-40 px-8 flex items-center justify-between border-b border-border/50">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative group max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="bg-secondary border-none rounded-xl pl-10 pr-4 py-2 text-sm w-full focus-visible:ring-1 focus-visible:ring-primary transition-all"
          />
        </div>
        {title && (
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-extrabold text-lg text-foreground tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <span className="text-[10px] font-bold text-accent bg-secondary px-2 py-1 rounded-full uppercase tracking-widest">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <button
          className="text-muted-foreground hover:bg-primary/10 rounded-full p-2 transition-all relative"
          aria-label="Notifikasi"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="text-muted-foreground hover:bg-primary/10 rounded-full p-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            }
          >
            <UserCircle2 className="w-6 h-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-headline bg-popover border border-border shadow-xl rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-bold flex flex-col">
                <span className="text-foreground">{userName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight">
                  {userRole === "admin" ? "Administrator" : "Barista"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem className="cursor-pointer gap-3 font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg">
                <Settings className="w-4 h-4" />
                Pengaturan Akun
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-3 font-semibold text-destructive focus:text-destructive focus:bg-destructive/10 hover:text-destructive hover:bg-destructive/10 rounded-lg mt-1"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
