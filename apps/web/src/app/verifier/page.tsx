"use client";

import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireVerifier } from "@/components/verifier/require-verifier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifierHomePage() {
  return (
    <AdminShell title="Portal Verifikasi">
      <RequireVerifier>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Verifikasi Listing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Tinjau listing yang menunggu verifikasi, approve/reject/request revisi.
              <div className="mt-4">
                <Link className="text-sm font-medium text-slate-900 hover:underline" href="/verifier/review/listings">
                  Buka Verifikasi Listing →
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Verifikasi Project</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Tinjau project yang menunggu verifikasi agar listing bisa tampil di publik.
              <div className="mt-4">
                <Link className="text-sm font-medium text-slate-900 hover:underline" href="/verifier/review/projects">
                  Buka Verifikasi Project →
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Verifikasi Developer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Tinjau profil developer yang menunggu verifikasi, beri catatan dan keputusan.
              <div className="mt-4">
                <Link className="text-sm font-medium text-slate-900 hover:underline" href="/verifier/review/developers">
                  Buka Verifikasi Developer →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </RequireVerifier>
    </AdminShell>
  );
}
