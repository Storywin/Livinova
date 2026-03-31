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

export default function TrialBalancePage() {
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

    const items = accounts
      .map((a) => {
        const s = sums.get(a.code) || { debit: 0, credit: 0 };
        const net = Number(s.debit) - Number(s.credit);
        return {
          ...a,
          debit: Number(s.debit),
          credit: Number(s.credit),
          debitBalance: net > 0 ? net : 0,
          creditBalance: net < 0 ? -net : 0,
        };
      })
      .filter((i) => Math.abs(i.debit) > 0.0001 || Math.abs(i.credit) > 0.0001 || Math.abs(i.debitBalance) > 0.0001 || Math.abs(i.creditBalance) > 0.0001)
      .sort((a, b) => a.code.localeCompare(b.code));

    const totals = items.reduce(
      (acc, i) => {
        acc.debit += i.debit;
        acc.credit += i.credit;
        acc.debitBalance += i.debitBalance;
        acc.creditBalance += i.creditBalance;
        return acc;
      },
      { debit: 0, credit: 0, debitBalance: 0, creditBalance: 0 },
    );

    return { items, totals };
  }, [accounts, journals, range]);

  return (
    <RequireErp allowedRoles={["tenant_admin"]}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black tracking-tight">Neraca Saldo</div>
              <div className="text-sm text-slate-500 font-medium">Periode: {monthLabel(period)}</div>
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
                  const csvRows = rows.items.map((i) => ({
                    code: i.code,
                    name: i.name,
                    type: i.type,
                    debit: i.debit,
                    credit: i.credit,
                    debitBalance: i.debitBalance,
                    creditBalance: i.creditBalance,
                  }));
                  downloadCsv(`neraca_saldo_${period}.csv`, csvRows);
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
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                      <th className="pb-5 font-bold">Akun</th>
                      <th className="pb-5 font-bold text-right">Debit</th>
                      <th className="pb-5 font-bold text-right">Kredit</th>
                      <th className="pb-5 font-bold text-right">Saldo Debit</th>
                      <th className="pb-5 font-bold text-right">Saldo Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.items.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/50">
                        <td className="py-5">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{i.code}</div>
                          <div className="text-sm font-black text-slate-900">{i.name}</div>
                        </td>
                        <td className="py-5 text-right font-black text-slate-900">{formatMoney(currency, i.debit)}</td>
                        <td className="py-5 text-right font-black text-slate-900">{formatMoney(currency, i.credit)}</td>
                        <td className="py-5 text-right font-black text-slate-900">{formatMoney(currency, i.debitBalance)}</td>
                        <td className="py-5 text-right font-black text-slate-900">{formatMoney(currency, i.creditBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-100">
                      <td className="pt-6 font-black text-slate-900">TOTAL</td>
                      <td className="pt-6 text-right font-black text-slate-900">{formatMoney(currency, rows.totals.debit)}</td>
                      <td className="pt-6 text-right font-black text-slate-900">{formatMoney(currency, rows.totals.credit)}</td>
                      <td className="pt-6 text-right font-black text-slate-900">{formatMoney(currency, rows.totals.debitBalance)}</td>
                      <td className="pt-6 text-right font-black text-slate-900">{formatMoney(currency, rows.totals.creditBalance)}</td>
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
