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
  monthLabel,
  parseMonthRange,
  sumDetailsByAccount,
} from "../_lib";

export default function BalanceSheetPage() {
  const params = useSearchParams();
  const period = params.get("period") || new Date().toISOString().slice(0, 7);
  const currency = params.get("currency") || "IDR";
  const range = useMemo(() => {
    const monthRange = parseMonthRange(period);
    return monthRange ? { start: new Date(0), end: monthRange.end } : null;
  }, [period]);

  const { data: accounts } = useQuery({
    queryKey: ["erp-accounts"],
    queryFn: () => apiFetch<Account[]>("/api/erp/accounts"),
  });

  const { data: journals } = useQuery({
    queryKey: ["erp-journals"],
    queryFn: () => apiFetch<JournalEntry[]>("/api/erp/journals"),
  });

  const rows = useMemo(() => {
    if (!accounts || !journals || !range) return null;
    const sums = sumDetailsByAccount(journals, range);

    const items = accounts.map((a) => {
      const s = sums.get(a.code) || { debit: 0, credit: 0 };
      const netDebitCredit = Number(s.debit) - Number(s.credit);
      const display =
        a.type === "asset" || a.type === "expense" ? netDebitCredit : -netDebitCredit;
      return { ...a, debit: Number(s.debit), credit: Number(s.credit), balance: display };
    });

    const group = (t: Account["type"]) =>
      items
        .filter((i) => i.type === t)
        .filter((i) => Math.abs(i.balance) > 0.0001)
        .sort((a, b) => a.code.localeCompare(b.code));

    const assets = group("asset");
    const liabilities = group("liability");
    const equity = group("equity");

    const totalAssets = assets.reduce((sum, i) => sum + i.balance, 0);
    const totalLiab = liabilities.reduce((sum, i) => sum + i.balance, 0);
    const totalEquity = equity.reduce((sum, i) => sum + i.balance, 0);

    return { assets, liabilities, equity, totalAssets, totalLiab, totalEquity };
  }, [accounts, journals, range]);

  return (
    <RequireErp allowedRoles={["tenant_admin"]}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black tracking-tight">Laporan Neraca</div>
              <div className="text-sm text-slate-500 font-medium">
                Periode: {monthLabel(period)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => window.close()}>
                Tutup
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  if (!rows) return;
                  const csvRows = [
                    ...rows.assets.map((a) => ({
                      section: "ASSET",
                      code: a.code,
                      name: a.name,
                      balance: a.balance,
                    })),
                    ...rows.liabilities.map((a) => ({
                      section: "LIABILITY",
                      code: a.code,
                      name: a.name,
                      balance: a.balance,
                    })),
                    ...rows.equity.map((a) => ({
                      section: "EQUITY",
                      code: a.code,
                      name: a.name,
                      balance: a.balance,
                    })),
                  ];
                  downloadCsv(`neraca_${period}.csv`, csvRows);
                }}
              >
                Download CSV
              </Button>
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

          {rows && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                <div className="text-lg font-black text-slate-900 tracking-tight">Aset</div>
                <div className="mt-6 space-y-3">
                  {rows.assets.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{a.code}</div>
                        <div className="text-sm font-black text-slate-900 truncate">{a.name}</div>
                      </div>
                      <div className="text-sm font-black text-slate-900 whitespace-nowrap">
                        {formatMoney(currency, a.balance)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between p-5 rounded-3xl bg-blue-50 border border-blue-100">
                  <div className="text-sm font-black text-blue-700">Total Aset</div>
                  <div className="text-base font-black text-blue-700">{formatMoney(currency, rows.totalAssets)}</div>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                  <div className="text-lg font-black text-slate-900 tracking-tight">Hutang</div>
                  <div className="mt-6 space-y-3">
                    {rows.liabilities.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{a.code}</div>
                          <div className="text-sm font-black text-slate-900 truncate">{a.name}</div>
                        </div>
                        <div className="text-sm font-black text-slate-900 whitespace-nowrap">
                          {formatMoney(currency, a.balance)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="text-sm font-black text-slate-700">Total Hutang</div>
                    <div className="text-base font-black text-slate-700">{formatMoney(currency, rows.totalLiab)}</div>
                  </div>
                </Card>

                <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                  <div className="text-lg font-black text-slate-900 tracking-tight">Modal</div>
                  <div className="mt-6 space-y-3">
                    {rows.equity.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{a.code}</div>
                          <div className="text-sm font-black text-slate-900 truncate">{a.name}</div>
                        </div>
                        <div className="text-sm font-black text-slate-900 whitespace-nowrap">
                          {formatMoney(currency, a.balance)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
                    <div className="text-sm font-black text-emerald-700">Total Modal</div>
                    <div className="text-base font-black text-emerald-700">{formatMoney(currency, rows.totalEquity)}</div>
                  </div>
                </Card>

                <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-slate-700">Hutang + Modal</div>
                    <div className="text-base font-black text-slate-900">
                      {formatMoney(currency, rows.totalLiab + rows.totalEquity)}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireErp>
  );
}
