"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  BadgeCheck,
  Building2,
  FileText,
  Globe,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Nama developer minimal 2 karakter"),
  description: z.string().min(50, "Profil perusahaan minimal 50 karakter").optional().or(z.literal("")),
  companyType: z.enum(["PT", "CV", "Perorangan", "Koperasi", "Lainnya"]).optional().or(z.literal("")),
  establishedYear: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{4}$/.test(v), "Tahun berdiri harus 4 digit")
    .refine((v) => !v || (Number(v) >= 1950 && Number(v) <= new Date().getFullYear()), "Tahun berdiri tidak valid"),
  portfolioUrl: z.string().url("URL portofolio tidak valid").optional().or(z.literal("")),
  website: z.string().url("Website tidak valid").optional().or(z.literal("")),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  contactPersonName: z.string().optional().or(z.literal("")),
  contactPersonRole: z.string().optional().or(z.literal("")),
  contactPersonEmail: z.string().email("Email PIC tidak valid").optional().or(z.literal("")),
  contactPersonPhone: z.string().min(8, "Nomor HP PIC minimal 8 digit").optional().or(z.literal("")),
  consentTerms: z.boolean().refine((v) => v, "Kamu harus menyetujui Syarat & Ketentuan"),
  consentPrivacy: z.boolean().refine((v) => v, "Kamu harus menyetujui Kebijakan Privasi"),
});

type FormValues = z.infer<typeof schema>;

export default function DeveloperRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; slug: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      companyType: "PT",
      establishedYear: "",
      portfolioUrl: "",
      website: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      contactPersonName: "",
      contactPersonRole: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
      consentTerms: false,
      consentPrivacy: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    try {
      const parsed = schema.parse(values);
      const payload = {
        name: parsed.name,
        description: parsed.description?.trim() ? parsed.description.trim() : undefined,
        companyType: parsed.companyType?.toString().trim() ? parsed.companyType.toString().trim() : undefined,
        establishedYear: parsed.establishedYear?.trim() ? parsed.establishedYear.trim() : undefined,
        portfolioUrl: parsed.portfolioUrl?.trim() ? parsed.portfolioUrl.trim() : undefined,
        website: parsed.website?.trim() ? parsed.website.trim() : undefined,
        email: parsed.email?.trim() ? parsed.email.trim() : undefined,
        phone: parsed.phone?.trim() ? parsed.phone.trim() : undefined,
        address: parsed.address?.trim() ? parsed.address.trim() : undefined,
        city: parsed.city?.trim() ? parsed.city.trim() : undefined,
        province: parsed.province?.trim() ? parsed.province.trim() : undefined,
        contactPersonName: parsed.contactPersonName?.trim() ? parsed.contactPersonName.trim() : undefined,
        contactPersonRole: parsed.contactPersonRole?.trim() ? parsed.contactPersonRole.trim() : undefined,
        contactPersonEmail: parsed.contactPersonEmail?.trim() ? parsed.contactPersonEmail.trim() : undefined,
        contactPersonPhone: parsed.contactPersonPhone?.trim() ? parsed.contactPersonPhone.trim() : undefined,
      };

      const res = await apiFetch<{ id: string; name: string; slug: string; verificationStatus: string }>(
        "/public/developers/apply",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      setSuccess({ name: res.name, slug: res.slug });
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
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/14 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/16 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-900">
              Beranda
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <span className="text-slate-700">Untuk Developer</span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Verifikasi developer & proyek
              </div>

              <h1 className="mt-4 text-balance text-[36px] font-semibold leading-[1.06] tracking-tight text-slate-900 md:text-[42px]">
                Daftar sebagai Developer
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
                Lengkapi profil perusahaan untuk proses verifikasi. Setelah disetujui, kamu bisa mengelola listing, promosi, dan
                request integrasi Smart Home untuk proyek Smart Living.
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Tampilan Profesional</div>
                        <div className="mt-1 text-sm text-slate-600">Profil publik developer, portofolio proyek, dan template pilihan.</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Kredibilitas</div>
                        <div className="mt-1 text-sm text-slate-600">Percepat trust user dengan data perusahaan yang lengkap.</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6 shadow-sm">
                <CardHeader>
                  <CardTitle>Form Pendaftaran Developer</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmit} className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Nama Developer / Perusahaan</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Input id="name" className="pl-10" placeholder="Contoh: Bali Smart Living" {...register("name")} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyType">Bentuk Usaha</Label>
                        <select
                          id="companyType"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          {...register("companyType")}
                        >
                          <option value="PT">PT</option>
                          <option value="CV">CV</option>
                          <option value="Perorangan">Perorangan</option>
                          <option value="Koperasi">Koperasi</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="establishedYear">Tahun Berdiri (opsional)</Label>
                        <Input id="establishedYear" inputMode="numeric" placeholder="Contoh: 2016" {...register("establishedYear")} />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Profil Perusahaan</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Textarea
                            id="description"
                            className="pl-10"
                            placeholder="Ceritakan fokus developer, track record proyek, standar kualitas, dan kesiapan Smart Living."
                            {...register("description")}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl">Portofolio (opsional)</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Input id="portfolioUrl" className="pl-10" placeholder="https://..." {...register("portfolioUrl")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website (opsional)</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Input id="website" className="pl-10" placeholder="https://..." {...register("website")} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Perusahaan (opsional)</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Input id="email" type="email" className="pl-10" placeholder="info@perusahaan.co.id" {...register("email")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telepon (opsional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Input id="phone" inputMode="tel" className="pl-10" placeholder="08xxxxxxxxxx" {...register("phone")} />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Alamat Kantor (opsional)</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Input id="address" className="pl-10" placeholder="Alamat lengkap kantor" {...register("address")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Provinsi (opsional)</Label>
                        <Input id="province" placeholder="Contoh: Bali" {...register("province")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Kota (opsional)</Label>
                        <Input id="city" placeholder="Contoh: Badung" {...register("city")} />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <User className="h-4 w-4" />
                        PIC (Person in Charge)
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="contactPersonName">Nama PIC (opsional)</Label>
                          <Input id="contactPersonName" placeholder="Nama lengkap" {...register("contactPersonName")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPersonRole">Jabatan PIC (opsional)</Label>
                          <Input id="contactPersonRole" placeholder="Contoh: Sales Manager" {...register("contactPersonRole")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPersonEmail">Email PIC (opsional)</Label>
                          <Input id="contactPersonEmail" type="email" placeholder="nama@perusahaan.co.id" {...register("contactPersonEmail")} />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="contactPersonPhone">HP PIC (opsional)</Label>
                          <Input id="contactPersonPhone" inputMode="tel" placeholder="08xxxxxxxxxx" {...register("contactPersonPhone")} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <input type="checkbox" className="mt-1 h-4 w-4" {...register("consentTerms")} />
                        <div className="text-sm text-slate-700">
                          Saya setuju dengan{" "}
                          <Link href="/syarat-ketentuan" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                            Syarat & Ketentuan
                          </Link>
                          .
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <input type="checkbox" className="mt-1 h-4 w-4" {...register("consentPrivacy")} />
                        <div className="text-sm text-slate-700">
                          Saya setuju dengan{" "}
                          <Link href="/kebijakan-privasi" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                            Kebijakan Privasi
                          </Link>
                          .
                        </div>
                      </div>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    ) : null}

                    {success ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        Pengajuan diterima untuk <span className="font-semibold">{success.name}</span>. Status: menunggu verifikasi.
                        Slug: <span className="font-mono">{success.slug}</span>
                      </div>
                    ) : null}

                    <Button type="submit" className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800" disabled={isSubmitting}>
                      {isSubmitting ? "Mengirim..." : "Kirim Pengajuan Developer"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="mt-6 text-sm text-slate-600">
                Sudah punya akun?{" "}
                <button className="font-semibold text-slate-900 hover:underline" onClick={() => router.push("/auth/login")} type="button">
                  Masuk
                </button>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Checklist Verifikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  {[
                    "Nama perusahaan + profil singkat",
                    "Kontak perusahaan & PIC",
                    "Alamat kantor (kota/provinsi)",
                    "Portofolio proyek (opsional)",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <div>{t}</div>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    Verifikasi membantu meningkatkan kepercayaan calon pembeli dan mempercepat konversi inquiry.
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Setelah Disetujui</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 ring-1 ring-slate-200">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Profil Publik Developer</div>
                      <div className="mt-1 text-slate-600">Pilih template, tampilkan properti, peta kantor, dan portofolio desain.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 ring-1 ring-slate-200">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Listing & Promosi</div>
                      <div className="mt-1 text-slate-600">Kelola listing, sorotan properti, dan kampanye promo.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
