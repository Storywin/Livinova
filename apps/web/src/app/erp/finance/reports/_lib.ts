"use client";

import { formatRupiah } from "@/lib/format";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type Account = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
};

export type JournalDetail = {
  id: string;
  accountId: string;
  debit: string | number;
  credit: string | number;
  account?: Account | null;
};

export type JournalEntry = {
  id: string;
  date: string;
  description: string;
  reference?: string | null;
  details: JournalDetail[];
};

export function parseMonthRange(monthId: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!year || month < 1 || month > 12) return null;
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

export function monthLabel(monthId: string) {
  const r = parseMonthRange(monthId);
  if (!r) return monthId;
  const date = new Date(r.start.getTime());
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function inRange(dateIso: string, range: { start: Date; end: Date }) {
  const d = new Date(dateIso);
  return d >= range.start && d < range.end;
}

export function sumDetailsByAccount(entries: JournalEntry[], range: { start: Date; end: Date }) {
  const map = new Map<
    string,
    { accountId: string; code: string; name: string; debit: number; credit: number }
  >();

  for (const je of entries) {
    if (!inRange(je.date, range)) continue;
    for (const d of je.details) {
      const key = d.account?.code;
      if (!key) continue;
      const cur = map.get(key) || {
        accountId: d.accountId,
        code: d.account?.code || key,
        name: d.account?.name || key,
        debit: 0,
        credit: 0,
      };
      cur.debit += Number(d.debit || 0);
      cur.credit += Number(d.credit || 0);
      map.set(key, cur);
    }
  }

  return map;
}

export function formatMoney(currency: string, amount: number) {
  if (currency === "IDR") return formatRupiah(amount);
  return formatRupiah(amount);
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(String(r[h] ?? ""))).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
