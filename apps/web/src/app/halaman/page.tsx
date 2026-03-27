import Link from "next/link";

import { Container } from "@/components/site/container";
import { apiFetch } from "@/lib/api";

type PageItem = {
  slug: string;
  title: string;
  metaDescription: string | null;
  updatedAt: string;
};

type ListPagesResponse = { items: PageItem[] };

export default async function PagesIndexPage() {
  let data: ListPagesResponse | null = null;
  try {
    data = await apiFetch<ListPagesResponse>("/public/pages");
  } catch {
    data = null;
  }
  const items = data?.items ?? [];

  return (
    <main className="py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Halaman</h1>
          <div className="mt-2 text-slate-600">Konten resmi Livinova (tentang, kebijakan, panduan, dll).</div>

          <div className="mt-8 grid gap-3">
            {!items.length ? <div className="text-slate-700">Belum ada halaman.</div> : null}
            {items.map((p) => (
              <Link key={p.slug} href={`/halaman/${p.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50">
                <div className="text-lg font-semibold text-slate-900">{p.title}</div>
                {p.metaDescription ? <div className="mt-1 text-sm text-slate-600">{p.metaDescription}</div> : null}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}

