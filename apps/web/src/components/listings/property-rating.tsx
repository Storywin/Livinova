"use client";

import { useState } from "react";
import { Star, User, UserCheck, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Rating = {
  id: string;
  rating: number;
  name: string;
  comment: string | null;
  createdAt: string;
};

type PropertyRatingProps = {
  listingId: string;
  averageRating: number;
  ratingCount: number;
  ratings: Rating[];
};

export function PropertyRating({ listingId, averageRating, ratingCount, ratings }: PropertyRatingProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: { rating: number; name?: string; comment?: string; isAnonymous: boolean }) => {
      return apiFetch(`/public/listings/${listingId}/ratings`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["listing"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ rating, name: isAnonymous ? undefined : name, comment, isAnonymous });
  };

  if (submitted) {
    return (
      <Card className="overflow-hidden rounded-3xl border-emerald-100 bg-emerald-50/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-900">Terima Kasih!</h3>
        <p className="text-slate-600">Rating Anda telah berhasil dikirim dan akan segera tampil di website.</p>
        <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setSubmitted(false)}>
          Kirim Rating Lainnya
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-black text-slate-900">{averageRating.toFixed(1)}</div>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-4 w-4",
                    s <= Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                  )}
                />
              ))}
            </div>
            <div className="mt-2 text-xs font-medium text-slate-500">{ratingCount} ulasan</div>
          </div>

          <div className="h-16 w-px bg-slate-200 hidden md:block" />

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = ratings.filter((r) => r.rating === s).length;
              const percentage = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-3 text-xs font-bold text-slate-600">{s}</span>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100 md:w-48">
                    <div className="h-full bg-amber-400" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Button className="rounded-2xl bg-slate-900 px-8 py-6 font-bold text-white hover:bg-slate-800" asChild>
          <a href="#rating-form">Tulis Ulasan</a>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Review List */}
        <div className="space-y-4 lg:col-span-7">
          <h3 className="text-lg font-bold text-slate-900">Ulasan Pengguna</h3>
          {ratings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              Belum ada ulasan untuk properti ini.
            </div>
          ) : (
            ratings.map((r) => (
              <Card key={r.id} className="rounded-3xl border-slate-100 shadow-sm transition hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        {r.name === "Anonymous" ? <User className="h-5 w-5" /> : <UserCheck className="h-5 w-5 text-sky-600" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{r.name}</div>
                        <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString("id-ID")}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3 w-3",
                            s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="mt-4 text-sm leading-relaxed text-slate-600">{r.comment}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Submit Form */}
        <div id="rating-form" className="lg:col-span-5">
          <Card className="sticky top-24 rounded-3xl border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-sky-600" />
                Berikan Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3 text-center">
                  <Label className="text-sm font-semibold">Skor Penilaian</Label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="transition-transform hover:scale-110 active:scale-95"
                        onClick={() => setRating(s)}
                      >
                        <Star
                          className={cn(
                            "h-8 w-8",
                            s <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-sm font-semibold">Nama Lengkap</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      <label htmlFor="anonymous" className="text-xs text-slate-500">Kirim Anonim</label>
                    </div>
                  </div>
                  <Input
                    id="name"
                    placeholder="Masukkan nama Anda..."
                    disabled={isAnonymous}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-slate-200 focus:ring-sky-500"
                    required={!isAnonymous}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-sm font-semibold">Komentar (Opsional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Apa pendapat Anda tentang perumahan ini?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[120px] rounded-xl border-slate-200 focus:ring-sky-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-2xl bg-sky-600 py-6 text-lg font-bold text-white hover:bg-sky-700"
                >
                  {mutation.isPending ? "Mengirim..." : (
                    <span className="flex items-center gap-2">
                      Kirim Rating <Send className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
