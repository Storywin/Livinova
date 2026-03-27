"use client";

import { 
  Building2, 
  Lock, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  Globe2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserCog,
  Briefcase,
  Users
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

type LoginResponse = {
  tokens?: {
    accessToken?: string;
  };
};

function getErrorMessage(error: unknown, fallback = "Login gagal. Silakan periksa kembali kredensial Anda.") {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "superadmin@livinova.local", password: "Admin12345!", icon: <ShieldAlert className="h-4 w-4" />, color: "from-rose-500 to-red-600" },
  { role: "Partner", email: "distributor@companya.id", password: "Partner12345!", icon: <UserCog className="h-4 w-4" />, color: "from-amber-500 to-orange-600" },
  { role: "Tenant Admin", email: "admin@properti.co.id", password: "Tenant12345!", icon: <Briefcase className="h-4 w-4" />, color: "from-blue-500 to-indigo-600" },
  { role: "Licensed Staff", email: "sales@properti.co.id", password: "Staff12345!", icon: <Users className="h-4 w-4" />, color: "from-emerald-500 to-teal-600" },
];

export default function ErpLoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (targetEmail: string, demoPassword?: string) => {
    setLoading(targetEmail);
    try {
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: targetEmail,
          password: demoPassword || password,
        }),
      });

      if (res.tokens?.accessToken) {
        setToken(res.tokens.accessToken);
        // Add a small delay to ensure token is saved to localStorage
        setTimeout(() => {
          router.push("/dashboard?from=erp");
        }, 100);
      }
    } catch (error: unknown) {
      console.error("Login failed:", error);
      alert(getErrorMessage(error));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]"></div>
        <div className="absolute -right-[10%] -bottom-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <Container className="relative z-10">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Side: Brand & Info */}
          <div className="hidden lg:block space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
                <Building2 className="h-7 w-7" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-white">LIVINOVA <span className="text-blue-500">ERP</span></span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl font-black leading-tight text-white">
                Kelola Aset Properti <br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic">Level Enterprise</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-md">
                Satu platform terintegrasi untuk efisiensi maksimal bisnis developer perumahan Anda.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <ShieldCheck className="text-blue-400" />, text: "Enkripsi Data Standar Perbankan" },
                { icon: <Globe2 className="text-blue-400" />, text: "Akses Real-time 24/7" },
                { icon: <Sparkles className="text-blue-400" />, text: "Fitur Automasi Dokumen" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                  <div className="h-5 w-5 shrink-0">{item.icon}</div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <Card className="overflow-hidden rounded-[40px] border-white/10 bg-slate-900/40 p-1 backdrop-blur-2xl shadow-2xl">
              <div className="rounded-[38px] bg-slate-900/80 p-8 md:p-12">
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="text-3xl font-black text-white mb-2">Selamat Datang</h2>
                  <p className="text-slate-500 text-sm">Pilih akun demo atau masukkan kredensial Anda</p>
                </div>

                {/* Demo Accounts Quick Login */}
                <div className="mb-8 grid grid-cols-2 gap-3">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleLogin(acc.email, acc.password)}
                      disabled={!!loading}
                      className="group relative flex flex-col items-start rounded-2xl border border-white/5 bg-white/5 p-3 text-left transition-all hover:border-blue-500/50 hover:bg-white/10 disabled:opacity-50"
                    >
                      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${acc.color} text-white shadow-lg`}>
                        {loading === acc.email ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : acc.icon}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-400 transition-colors">{acc.role}</div>
                      <div className="text-[11px] font-medium text-slate-300 truncate w-full">{acc.email.split('@')[0]}</div>
                    </button>
                  ))}
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500 font-bold tracking-widest">Atau Login Manual</span></div>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(email); }}>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-400">ID Pengguna / Email</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@developer.id" 
                        className="h-14 rounded-2xl border-white/5 bg-white/5 pl-12 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pass" className="text-xs font-bold uppercase tracking-widest text-slate-400">Kata Sandi</Label>
                      <Link href="#" className="text-xs font-bold text-blue-500 hover:text-blue-400">Lupa Sandi?</Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="h-5 w-5" />
                      </div>
                      <Input 
                        id="pass" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className="h-14 rounded-2xl border-white/5 bg-white/5 pl-12 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={!!loading}
                    className="w-full h-14 rounded-2xl bg-blue-600 text-lg font-bold hover:bg-blue-700 shadow-xl shadow-blue-600/20 group"
                  >
                    {loading && !DEMO_ACCOUNTS.some(a => a.email === loading) ? "Memproses..." : (
                      <span className="flex items-center gap-2">
                        Masuk ke Dashboard <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-xs text-slate-500">
                    Belum memiliki akun ERP?{" "}
                    <a
                      href={`https://wa.me/625882449242?text=${encodeURIComponent(
                        "Halo Admin, Apakah saya bisa mencoba ERP Property nya ? apakah ada account trialnya ? saya tertarik dengan ERP Properti Livinova, tetapi saya ingin mencoba terlebih dahulu.\n\nTerima Kasih"
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 font-bold hover:underline"
                    >
                      Hubungi Livinova Support
                    </a>
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Mobile Brand Footer */}
            <div className="mt-8 text-center lg:hidden">
              <span className="text-sm font-bold tracking-tighter text-slate-600">LIVINOVA ERP ENTERPRISE</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
