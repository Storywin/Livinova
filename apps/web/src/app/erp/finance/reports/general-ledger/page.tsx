"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireErp } from "@/components/erp/require-erp";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Account,
  JournalEntry,
  downloadCsv,
  formatMoney,
  inRange,
  monthLabel,
  parseMonthRange,
} from "../_lib";

export default function GeneralLedgerPage() {
  const params = useSearchParams();
  const period = params.get("period") || new Date().toISOString().slice(0, 7);
  const currency = params.get("currency") || "IDR";
  const accountCode = params.get("accountCode") || "";
  const range = parseMonthRange(period);

  const { data: accounts } = useQuery({
    queryKey: ["erp-accounts"],
    queryFn: () => apiFetch<Account[]>("/api/erp/accounts"),
  });

  const { data: journals } = useQuery({
    queryKey: ["erp-journals"],
    queryFn: () => apiFetch<JournalEntry[]>("/api/erp/journals"),
  });

  const selected = useMemo(() => {
    if (!accounts || !accountCode) return null;
    return accounts.find((a) => a.code === accountCode) || null;
  }, [accountCode, accounts]);

  const lines = useMemo(() => {
    if (!journals || !range || !accountCode) return null;
    const out: Array<{
      id: string;
      date: string;
      description: string;
      reference?: string | null;
      debit: number;
      credit: number;
    }> = [];
    for (const je of journals) {
      if (!inRange(je.date, range)) continue;
      const matched = je.details.filter((d) => d.account?.code === accountCode);
      if (matched.length === 0) continue;
      const debit = matched.reduce((sum, d) => sum + Number(d.debit || 0), 0);
      const credit = matched.reduce((sum, d) => sum + Number(d.credit || 0), 0);
      out.push({
        id: je.id,
        date: je.date,
        description: je.description,
        reference: je.reference ?? null,
        debit,
        credit,
      });
    }
    out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return out;
  }, [accountCode, journals, range]);

  const totals = useMemo(() => {
    if (!lines) return null;
    const debit = lines.reduce((sum, l) => sum + l.debit, 0);
    const credit = lines.reduce((sum, l) => sum + l.credit, 0);
    return { debit, credit, net: debit - credit };
  }, [lines]);

  return (
    <RequireErp allowedRoles={["tenant_admin"]}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black tracking-tight">Buku Besar</div>
              <div className="text-sm text-slate-500 font-medium">Periode: {monthLabel(period)}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => window.close()}>
                Tutup
              </Button>
              {accountCode && (
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    if (!lines || !selected) return;
                    const csvRows = lines.map((l) => ({
                      date: new Date(l.date).toLocaleDateString("id-ID"),
                      reference: l.reference || "",
                      description: l.description,
                      debit: l.debit,
                      credit: l.credit,
                    }));
                    downloadCsv(`buku_besar_${selected.code}_${period}.csv`, csvRows);
                  }}
                >
                  Download CSV
                </Button>
              )}
              <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700" onClick={() => window.print()}>
                Print (PDF)
              </Button>
            </div>
          </div>

          {!range && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="text-sm font-bold text-rose-600">Periode tidak valid</div>
            </Card>
          )}

          {range && !accountCode && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Pilih Akun
              </div>
              <div className="mt-6 grid gap-3">
                {(accounts || [])
                  .slice()
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((a) => (
                    <a
                      key={a.id}
                      href={`/erp/finance/reports/general-ledger?period=${encodeURIComponent(period)}&currency=${encodeURIComponent(currency)}&accountCode=${encodeURIComponent(a.code)}`}
                      className="block p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{a.code}</div>
                          <div className="text-sm font-black text-slate-900 truncate">{a.name}</div>
                          <div className="text-xs text-slate-500 font-medium mt-2">{a.type}</div>
                        </div>
                        <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-slate-200 text-slate-700 shadow-sm">
                          Buka
                        </span>
                      </div>
                    </a>
                  ))}
              </div>
            </Card>
          )}

          {selected && lines && totals && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Akun</div>
                  <div className="text-xl font-black text-slate-900 tracking-tight mt-2">
                    {selected.code} • {selected.name}
                  </div>
                  <div className="text-sm text-slate-500 font-medium mt-2">Tipe: {selected.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net</div>
                  <div className="text-xl font-black text-blue-600 tracking-tight mt-2">{formatMoney(currency, totals.net)}</div>
                </div>
              </div>

              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                      <th className="pb-5 font-bold">Tanggal</th>
                      <th className="pb-5 font-bold">Referensi</th>
                      <th className="pb-5 font-bold">Keterangan</th>
                      <th className="pb-5 font-bold text-right">Debit</th>
                      <th className="pb-5 font-bold text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="py-5 text-sm font-bold text-slate-700">
                          {new Date(l.date).toLocaleDateString("id-ID")}
                        </td>
                        <td className="py-5 text-xs font-black text-slate-500">{l.reference || "-"}</td>
                        <td className="py-5 text-sm font-bold text-slate-700">{l.description}</td>
                        <td className="py-5 text-right font-black text-slate-900">{formatMoney(currency, l.debit)}</td>
                        <td className="py-5 text-right font-black text-slate-900">{formatMoney(currency, l.credit)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-100">
                      <td className="pt-6 font-black text-slate-900" colSpan={3}>
                        TOTAL
                      </td>
                      <td className="pt-6 text-right font-black text-slate-900">{formatMoney(currency, totals.debit)}</td>
                      <td className="pt-6 text-right font-black text-slate-900">{formatMoney(currency, totals.credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </RequireErp>
  );
}
