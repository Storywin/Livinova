"use client";

import Link from "next/link";

import { Container } from "@/components/site/container";
import { RequireBuyer } from "@/components/buyer/require-buyer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BuyerDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Container className="py-10">
        <RequireBuyer>
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard Buyer</h1>
              <div className="mt-1 text-sm text-slate-600">Akses cepat untuk eksplorasi properti dan simulasi KPR.</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Jelajahi Properti</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  Lihat daftar properti terbaru dan detail proyek smart living.
                  <div className="mt-4">
                    <Link className="font-medium text-slate-900 hover:underline" href="/properti">
                      Buka Properti →
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Simulasi KPR</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  Bandingkan cicilan dari beberapa bank untuk skenario DP dan tenor kamu.
                  <div className="mt-4">
                    <Link className="font-medium text-slate-900 hover:underline" href="/kpr">
                      Buka Simulasi KPR →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </RequireBuyer>
      </Container>
    </main>
  );
}

