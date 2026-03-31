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

export default function IncomeStatementPage() {
  const params = useSearchParams();
  const period = params.get("period") || new Date().toISOString().slice(0, 7);
  const currency = params.get("currency") || "IDR";
  const range = parseMonthRange(period);

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
      return { ...a, debit: Number(s.debit), credit: Number(s.credit), amount: display };
    });

    const income = items
      .filter((i) => i.type === "income")
      .filter((i) => Math.abs(i.amount) > 0.0001)
      .sort((a, b) => a.code.localeCompare(b.code));
    const expense = items
      .filter((i) => i.type === "expense")
      .filter((i) => Math.abs(i.amount) > 0.0001)
      .sort((a, b) => a.code.localeCompare(b.code));

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expense.reduce((sum, i) => sum + i.amount, 0);
    const profit = totalIncome - totalExpense;

    return { income, expense, totalIncome, totalExpense, profit };
  }, [accounts, journals, range]);

  return (
    <RequireErp allowedRoles={["tenant_admin"]}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black tracking-tight">Laporan Laba Rugi</div>
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
                    ...rows.income.map((a) => ({
                      section: "INCOME",
                      code: a.code,
                      name: a.name,
                      amount: a.amount,
                    })),
                    ...rows.expense.map((a) => ({
                      section: "EXPENSE",
                      code: a.code,
                      name: a.name,
                      amount: a.amount,
                    })),
                    { section: "TOTAL", code: "", name: "TOTAL_INCOME", amount: rows.totalIncome },
                    { section: "TOTAL", code: "", name: "TOTAL_EXPENSE", amount: rows.totalExpense },
                    { section: "TOTAL", code: "", name: "PROFIT", amount: rows.profit },
                  ];
                  downloadCsv(`laba_rugi_${period}.csv`, csvRows);
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
                <div className="text-lg font-black text-slate-900 tracking-tight">Pendapatan</div>
                <div className="mt-6 space-y-3">
                  {rows.income.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{a.code}</div>
                        <div className="text-sm font-black text-slate-900 truncate">{a.name}</div>
                      </div>
                      <div className="text-sm font-black text-slate-900 whitespace-nowrap">
                        {formatMoney(currency, a.amount)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
                  <div className="text-sm font-black text-emerald-700">Total Pendapatan</div>
                  <div className="text-base font-black text-emerald-700">{formatMoney(currency, rows.totalIncome)}</div>
                </div>
              </Card>

              <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                <div className="text-lg font-black text-slate-900 tracking-tight">Beban</div>
                <div className="mt-6 space-y-3">
                  {rows.expense.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{a.code}</div>
                        <div className="text-sm font-black text-slate-900 truncate">{a.name}</div>
                      </div>
                      <div className="text-sm font-black text-slate-900 whitespace-nowrap">
                        {formatMoney(currency, a.amount)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between p-5 rounded-3xl bg-amber-50 border border-amber-100">
                  <div className="text-sm font-black text-amber-700">Total Beban</div>
                  <div className="text-base font-black text-amber-700">{formatMoney(currency, rows.totalExpense)}</div>
                </div>
              </Card>

              <Card className="rounded-[2rem] p-8 border-slate-200 bg-white lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-700">Laba (Rugi)</div>
                  <div className="text-xl font-black text-blue-600">{formatMoney(currency, rows.profit)}</div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </RequireErp>
  );
}

