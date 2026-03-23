"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  phone: z.string().min(8, "Nomor HP minimal 8 digit").optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "", password: "", name: "", phone: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const cleaned = schema.parse({
        ...values,
        name: values.name?.trim() ? values.name.trim() : undefined,
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
      });

      const result = await apiFetch<{
        user: { id: string; email: string; roles: string[] };
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(cleaned),
      });

      localStorage.setItem("livinova_access_token", result.tokens.accessToken);
      localStorage.setItem("livinova_refresh_token", result.tokens.refreshToken);
      router.push("/");
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.issues[0]?.message ?? "Data tidak valid");
        return;
      }
      if (e instanceof ApiError) {
        setError(e.message);
        return;
      }
      setError("Terjadi kesalahan. Coba lagi.");
    }
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Kembali ke Beranda
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Buat Akun</h1>
        <p className="mt-2 text-sm text-slate-600">
          Daftar untuk menyimpan favorit, membandingkan properti, dan mengirim inquiry.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata Sandi</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nama (opsional)</Label>
          <Input id="name" {...register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor HP (opsional)</Label>
          <Input id="phone" inputMode="tel" {...register("phone")} />
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Memproses..." : "Daftar"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="font-medium text-slate-900 hover:underline">
          Masuk
        </Link>
      </div>
    </main>
  );
}
