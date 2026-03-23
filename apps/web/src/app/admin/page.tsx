"use client";

import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <AdminShell title="Ringkasan">
      <RequireAdmin>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Verifikasi Listing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Tinjau listing yang menunggu verifikasi, berikan catatan, approve/reject/request revision.
              <div className="mt-4">
                <Link className="text-sm font-medium text-slate-900 hover:underline" href="/admin/review/listings">
                  Buka Verifikasi Listing →
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Pengaturan KPR</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Kelola bank, produk, suku bunga, margin syariah, biaya admin, provisi, notaris, dan asumsi lainnya.
              <div className="mt-4">
                <Link className="text-sm font-medium text-slate-900 hover:underline" href="/admin/mortgage">
                  Buka Pengaturan KPR →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </RequireAdmin>
    </AdminShell>
  );
}

