"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { RequireDeveloper } from "@/components/developer/require-developer";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchWithAuth } from "@/lib/api-auth";
import { formatRupiah } from "@/lib/format";

type ListingImage = { id: string; url: string; mediaAssetId: string; kind: string; sortOrder: number };

type ListingDetail = {
  id: string;
  title: string;
  slug: string;
  status: string;
  verificationStatus: string;
  description: string | null;
  price: string | null;
  startingPrice: string | null;
  brochureUrl: string | null;
  unit: {
    id: string;
    title: string;
    propertyType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    buildingSize: number | null;
    landSize: number | null;
    price: string | null;
    startingPrice: string | null;
    availableUnits: number | null;
  } | null;
  project: { id: string; name: string; slug: string };
  images: ListingImage[];
};

export default function DeveloperListingDetailPage() {
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();
  const listingId = params.id;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const listingQuery = useQuery({
    queryKey: ["developer-listing", listingId],
    queryFn: () => apiFetchWithAuth<ListingDetail>(`/developer/listings/${listingId}`),
  });

  const listing = listingQuery.data ?? null;

  const [form, setForm] = useState({ title: "", description: "", price: "" });
  const [unitForm, setUnitForm] = useState({
    title: "",
    propertyType: "rumah",
    bedrooms: "",
    bathrooms: "",
    buildingSize: "",
    landSize: "",
    price: "",
    startingPrice: "",
    availableUnits: "",
  });

  useEffect(() => {
    if (!listing) return;
    setForm({
      title: listing.title ?? "",
      description: listing.description ?? "",
      price: listing.price ?? "",
    });
    setUnitForm({
      title: listing.unit?.title ?? listing.title ?? "",
      propertyType: listing.unit?.propertyType ?? "rumah",
      bedrooms: listing.unit?.bedrooms !== null && listing.unit?.bedrooms !== undefined ? String(listing.unit.bedrooms) : "",
      bathrooms: listing.unit?.bathrooms !== null && listing.unit?.bathrooms !== undefined ? String(listing.unit.bathrooms) : "",
      buildingSize: listing.unit?.buildingSize !== null && listing.unit?.buildingSize !== undefined ? String(listing.unit.buildingSize) : "",
      landSize: listing.unit?.landSize !== null && listing.unit?.landSize !== undefined ? String(listing.unit.landSize) : "",
      price: listing.unit?.price ?? "",
      startingPrice: listing.unit?.startingPrice ?? "",
      availableUnits: listing.unit?.availableUnits !== null && listing.unit?.availableUnits !== undefined ? String(listing.unit.availableUnits) : "",
    });
  }, [listing]);

  const canEdit = useMemo(() => listing?.status !== "published", [listing?.status]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        price: form.price.trim() ? Number(form.price) : null,
      };
      return apiFetchWithAuth(`/developer/listings/${listingId}`, { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      setError(null);
      setSuccess("Perubahan tersimpan");
      await qc.invalidateQueries({ queryKey: ["developer-listing", listingId] });
      await qc.invalidateQueries({ queryKey: ["developer-listings"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan"),
  });

  const submitMutation = useMutation({
    mutationFn: async () => apiFetchWithAuth(`/developer/listings/${listingId}/submit`, { method: "POST" }),
    onSuccess: async () => {
      setError(null);
      setSuccess("Listing berhasil dikirim untuk verifikasi");
      await qc.invalidateQueries({ queryKey: ["developer-listing", listingId] });
      await qc.invalidateQueries({ queryKey: ["developer-listings"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal submit listing"),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetchWithAuth<ListingImage>(`/developer/listings/${listingId}/images`, { method: "POST", body: fd });
    },
    onSuccess: async () => {
      setError(null);
      setSuccess("Gambar berhasil diunggah");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await qc.invalidateQueries({ queryKey: ["developer-listing", listingId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal upload gambar"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => apiFetchWithAuth(`/developer/listings/${listingId}/images/${imageId}`, { method: "DELETE" }),
    onSuccess: async () => {
      setError(null);
      setSuccess("Gambar dihapus");
      await qc.invalidateQueries({ queryKey: ["developer-listing", listingId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal hapus gambar"),
  });

  const unitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: unitForm.title.trim() || undefined,
        propertyType: unitForm.propertyType,
        bedrooms: unitForm.bedrooms.trim() ? Number(unitForm.bedrooms) : null,
        bathrooms: unitForm.bathrooms.trim() ? Number(unitForm.bathrooms) : null,
        buildingSize: unitForm.buildingSize.trim() ? Number(unitForm.buildingSize) : null,
        landSize: unitForm.landSize.trim() ? Number(unitForm.landSize) : null,
        price: unitForm.price.trim() ? Number(unitForm.price) : null,
        startingPrice: unitForm.startingPrice.trim() ? Number(unitForm.startingPrice) : null,
        availableUnits: unitForm.availableUnits.trim() ? Number(unitForm.availableUnits) : null,
      };
      return apiFetchWithAuth(`/developer/listings/${listingId}/unit`, { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      setError(null);
      setSuccess("Unit tersimpan");
      await qc.invalidateQueries({ queryKey: ["developer-listing", listingId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan unit"),
  });

  const brochureInputRef = useRef<HTMLInputElement | null>(null);

  const brochureMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetchWithAuth<{ id: string; url: string; kind: string }>(`/developer/listings/${listingId}/brochure`, { method: "POST", body: fd });
    },
    onSuccess: async () => {
      setError(null);
      setSuccess("Brochure berhasil diunggah");
      if (brochureInputRef.current) brochureInputRef.current.value = "";
      await qc.invalidateQueries({ queryKey: ["developer-listing", listingId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal upload brochure"),
  });

  return (
    <RequireDeveloper>
      <main className="min-h-screen bg-slate-50">
        <Container className="py-10">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-500">
                  <Link className="hover:text-slate-900 hover:underline" href="/developer/listings">
                    Listing
                  </Link>
                  <span className="px-2 text-slate-300">/</span>
                  <span className="text-slate-700">{listing?.title ?? "Detail"}</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{listing?.title ?? "—"}</h1>
                <div className="mt-1 text-sm text-slate-600">
                  Status: <span className="font-semibold text-slate-900">{listing?.status ?? "—"}</span> • Verifikasi:{" "}
                  <span className="font-semibold text-slate-900">{listing?.verificationStatus ?? "—"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/developer/listings">Kembali</Link>
                </Button>
                {listing?.slug ? (
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href={`/properti/${listing.slug}`} target="_blank">
                      Lihat di Publik
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            {listingQuery.isLoading ? <div className="text-sm text-slate-600">Memuat...</div> : null}

            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Informasi Listing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
                    {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

                    <div className="space-y-2">
                      <Label>Judul</Label>
                      <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} disabled={!canEdit} />
                    </div>

                    <div className="space-y-2">
                      <Label>Deskripsi</Label>
                      <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} disabled={!canEdit} />
                    </div>

                    <div className="space-y-2">
                      <Label>Harga (Rp)</Label>
                      <Input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} disabled={!canEdit} inputMode="numeric" />
                      <div className="text-xs text-slate-500">{form.price.trim() ? formatRupiah(form.price) : "—"}</div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => {
                          setError(null);
                          setSuccess(null);
                          saveMutation.mutate();
                        }}
                        disabled={!canEdit || saveMutation.isPending}
                      >
                        {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          setError(null);
                          setSuccess(null);
                          submitMutation.mutate();
                        }}
                        disabled={submitMutation.isPending || listing?.status === "pending" || listing?.status === "published"}
                      >
                        {submitMutation.isPending ? "Mengirim..." : "Submit untuk Verifikasi"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Unit & Spesifikasi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Unit</Label>
                      <Input value={unitForm.title} onChange={(e) => setUnitForm((p) => ({ ...p, title: e.target.value }))} disabled={!canEdit} />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipe Properti</Label>
                      <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={unitForm.propertyType} onChange={(e) => setUnitForm((p) => ({ ...p, propertyType: e.target.value }))} disabled={!canEdit}>
                        <option value="rumah">Rumah</option>
                        <option value="apartemen">Apartemen</option>
                        <option value="ruko">Ruko</option>
                        <option value="villa">Villa</option>
                        <option value="tanah">Tanah</option>
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Kamar Tidur</Label>
                        <Input value={unitForm.bedrooms} onChange={(e) => setUnitForm((p) => ({ ...p, bedrooms: e.target.value }))} inputMode="numeric" disabled={!canEdit} />
                      </div>
                      <div className="space-y-2">
                        <Label>Kamar Mandi</Label>
                        <Input value={unitForm.bathrooms} onChange={(e) => setUnitForm((p) => ({ ...p, bathrooms: e.target.value }))} inputMode="numeric" disabled={!canEdit} />
                      </div>
                      <div className="space-y-2">
                        <Label>Luas Bangunan (m²)</Label>
                        <Input value={unitForm.buildingSize} onChange={(e) => setUnitForm((p) => ({ ...p, buildingSize: e.target.value }))} inputMode="numeric" disabled={!canEdit} />
                      </div>
                      <div className="space-y-2">
                        <Label>Luas Tanah (m²)</Label>
                        <Input value={unitForm.landSize} onChange={(e) => setUnitForm((p) => ({ ...p, landSize: e.target.value }))} inputMode="numeric" disabled={!canEdit} />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga Unit (Rp)</Label>
                        <Input value={unitForm.price} onChange={(e) => setUnitForm((p) => ({ ...p, price: e.target.value }))} inputMode="numeric" disabled={!canEdit} />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga Mulai (Rp)</Label>
                        <Input value={unitForm.startingPrice} onChange={(e) => setUnitForm((p) => ({ ...p, startingPrice: e.target.value }))} inputMode="numeric" disabled={!canEdit} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Jumlah Unit Tersedia</Label>
                        <Input value={unitForm.availableUnits} onChange={(e) => setUnitForm((p) => ({ ...p, availableUnits: e.target.value }))} inputMode="numeric" disabled={!canEdit} />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => {
                          setError(null);
                          setSuccess(null);
                          unitMutation.mutate();
                        }}
                        disabled={!canEdit || unitMutation.isPending}
                      >
                        {unitMutation.isPending ? "Menyimpan..." : "Simpan Unit"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Brochure</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {listing?.brochureUrl ? (
                      <div className="text-sm text-slate-700">
                        Brochure saat ini:{" "}
                        <a className="font-semibold text-sky-700 hover:underline" href={listing.brochureUrl} target="_blank" rel="noreferrer">
                          Unduh PDF
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">Belum ada brochure.</div>
                    )}
                    <div className="space-y-2">
                      <Label>Upload Brochure (PDF)</Label>
                      <input
                        ref={brochureInputRef}
                        type="file"
                        accept="application/pdf"
                        className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setError(null);
                          setSuccess(null);
                          brochureMutation.mutate(file);
                        }}
                        disabled={!canEdit || brochureMutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Gambar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Upload Gambar</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setError(null);
                        setSuccess(null);
                        uploadMutation.mutate(file);
                      }}
                      disabled={uploadMutation.isPending}
                    />
                    <div className="text-xs text-slate-500">Gambar akan tersimpan di /uploads dan dipakai sebagai foto listing.</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(listing?.images ?? []).map((img) => (
                      <div key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <Image src={img.url} alt="listing" className="h-28 w-full object-cover" width={360} height={200} />
                        <div className="absolute inset-x-0 bottom-0 flex justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            className="rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-white"
                            onClick={() => deleteImageMutation.mutate(img.id)}
                            disabled={deleteImageMutation.isPending}
                            type="button"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!listing?.images?.length ? <div className="text-sm text-slate-600">Belum ada gambar.</div> : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </RequireDeveloper>
  );
}
