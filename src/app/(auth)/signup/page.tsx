"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Coffee, User, Mail, Lock, Loader2, UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Lengkapi semua kolom.");

    setIsLoading(true);

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          toast.success("Akun berhasil dibuat!");
          router.push("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Gagal membuat akun. Coba lagi.");
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel: Cover Image */}
      <div className="hidden lg:flex w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10 mix-blend-multiply" />
        <Image
          unoptimized
          src="/images/barista-profile.jpg"
          alt="The Atelier Coffee Shop"
          fill
          priority
          className="object-cover scale-105"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-20 text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/90 flex items-center justify-center text-primary-foreground mb-6 shadow-xl backdrop-blur-md border border-white/20">
            <Coffee className="w-10 h-10" />
          </div>
          <h1 className="font-headline text-5xl font-extrabold text-white tracking-widest uppercase mb-4 drop-shadow-md">
            The Atelier
          </h1>
          <p className="text-white/80 font-medium tracking-widest uppercase text-sm drop-shadow-sm">
            Bergabunglah, kuasai seni menyeduh.
          </p>
        </motion.div>
      </div>

      {/* Right Panel: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto space-y-8"
        >
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-headline text-4xl font-extrabold text-foreground tracking-tight">
              Buat Akun
            </h2>
            <p className="text-muted-foreground font-medium">
              Daftarkan staf baru. Role default adalah Barista.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    required
                    placeholder="Julian Atelier"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 bg-card border-border rounded-xl shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="kasir@theatelier.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-card border-border rounded-xl shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-card border-border rounded-xl shadow-sm"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Daftar</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Masuk
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
