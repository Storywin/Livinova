"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireErp } from "@/components/erp/require-erp";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Employee = {
  id: string;
  employeeNo: string;
  name: string;
  department?: string | null;
  position?: string | null;
};

type PayrollPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type PayrollSettlement = {
  id: string;
  kind: "pph21" | "bpjs";
  date: string;
  amount: string;
  cashAccountCode: string;
  notes?: string | null;
};

type PayrollLine = {
  id: string;
  employeeId: string;
  gross: string;
  allowance: string;
  pph21: string;
  bpjsEmployee: string;
  bpjsEmployer: string;
  net: string;
  employee: Employee;
};

type PayrollRun = {
  id: string;
  status: string;
  grossTotal: string;
  deductionsTotal: string;
  netTotal: string;
  period: PayrollPeriod;
  lines: PayrollLine[];
  settlements: PayrollSettlement[];
};

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
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

export default function PayrollReportPage() {
  const params = useSearchParams();
  const runId = params.get("runId") || "";

  const { data: run, isLoading, isError } = useQuery({
    queryKey: ["erp-payroll-report", runId],
    queryFn: () => apiFetch<PayrollRun>(`/api/erp/payroll/runs/${runId}`),
    enabled: runId.length > 0,
  });

  const totals = useMemo(() => {
    if (!run) return null;
    const gross = run.lines.reduce((sum, l) => sum + Number(l.gross), 0);
    const net = run.lines.reduce((sum, l) => sum + Number(l.net), 0);
    const pph21 = run.lines.reduce((sum, l) => sum + Number(l.pph21), 0);
    const bpjsEmployee = run.lines.reduce((sum, l) => sum + Number(l.bpjsEmployee), 0);
    const bpjsEmployer = run.lines.reduce((sum, l) => sum + Number(l.bpjsEmployer), 0);
    const pph21Paid = run.settlements
      .filter((s) => s.kind === "pph21")
      .reduce((sum, s) => sum + Number(s.amount), 0);
    const bpjsPaid = run.settlements
      .filter((s) => s.kind === "bpjs")
      .reduce((sum, s) => sum + Number(s.amount), 0);
    const bpjsTotal = bpjsEmployee + bpjsEmployer;
    return {
      gross,
      net,
      pph21,
      bpjsEmployee,
      bpjsEmployer,
      bpjsTotal,
      pph21Paid,
      bpjsPaid,
      pph21Remaining: Math.max(0, pph21 - pph21Paid),
      bpjsRemaining: Math.max(0, bpjsTotal - bpjsPaid),
    };
  }, [run]);

  const departmentSummary = useMemo(() => {
    if (!run) return [];
    const map = new Map<
      string,
      { department: string; headcount: number; gross: number; net: number; pph21: number; bpjsTotal: number }
    >();
    for (const l of run.lines) {
      const key = (l.employee.department || "Tanpa Departemen").trim();
      const current =
        map.get(key) || { department: key, headcount: 0, gross: 0, net: 0, pph21: 0, bpjsTotal: 0 };
      current.headcount += 1;
      current.gross += Number(l.gross);
      current.net += Number(l.net);
      current.pph21 += Number(l.pph21);
      current.bpjsTotal += Number(l.bpjsEmployee) + Number(l.bpjsEmployer);
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => a.department.localeCompare(b.department, "id-ID"));
  }, [run]);

  return (
    <RequireErp allowedRoles={["tenant_admin"]}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black tracking-tight">Payroll Report</div>
              <div className="text-sm text-slate-500 font-medium">
                {run?.period?.name ? `Periode: ${run.period.name}` : "Periode Payroll"}
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
                  if (!run) return;
                  const rows = run.lines.map((l) => ({
                    employeeNo: l.employee.employeeNo,
                    name: l.employee.name,
                    department: l.employee.department || "",
                    position: l.employee.position || "",
                    gross: Number(l.gross),
                    allowance: Number(l.allowance),
                    pph21: Number(l.pph21),
                    bpjsEmployee: Number(l.bpjsEmployee),
                    bpjsEmployer: Number(l.bpjsEmployer),
                    net: Number(l.net),
                  }));
                  downloadCsv(`payroll_${run.period.name.replaceAll(" ", "_")}.csv`, rows);
                }}
              >
                Download CSV
              </Button>
              <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700" onClick={() => window.print()}>
                Print (PDF)
              </Button>
            </div>
          </div>

          {!runId && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="text-sm font-bold text-slate-700">runId belum diisi</div>
            </Card>
          )}

          {isLoading && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="text-sm font-bold text-slate-700">Memuat data...</div>
            </Card>
          )}

          {isError && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="text-sm font-bold text-rose-600">Gagal memuat report payroll</div>
            </Card>
          )}

          {run && totals && (
            <>
              <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Karyawan</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{run.lines.length}</div>
                    <div className="text-xs text-slate-500 font-medium mt-2">Status: {run.status}</div>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gross</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totals.gross)}</div>
                    <div className="text-xs text-slate-500 font-medium mt-2">
                      Net: {formatRupiah(totals.net)}
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PPh21</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totals.pph21)}</div>
                    <div className="text-xs text-slate-500 font-medium mt-2">
                      Sisa: {formatRupiah(totals.pph21Remaining)}
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">BPJS</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totals.bpjsTotal)}</div>
                    <div className="text-xs text-slate-500 font-medium mt-2">
                      Sisa: {formatRupiah(totals.bpjsRemaining)}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-black text-slate-900 tracking-tight">Rekap Per Departemen</div>
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                        <th className="pb-5 font-bold">Departemen</th>
                        <th className="pb-5 font-bold text-right">Karyawan</th>
                        <th className="pb-5 font-bold text-right">Gross</th>
                        <th className="pb-5 font-bold text-right">Net</th>
                        <th className="pb-5 font-bold text-right">PPh21</th>
                        <th className="pb-5 font-bold text-right">BPJS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {departmentSummary.map((d) => (
                        <tr key={d.department} className="hover:bg-slate-50/50">
                          <td className="py-5 font-black text-slate-900">{d.department}</td>
                          <td className="py-5 text-right font-black text-slate-900">{d.headcount}</td>
                          <td className="py-5 text-right font-black text-slate-900">{formatRupiah(d.gross)}</td>
                          <td className="py-5 text-right font-black text-slate-900">{formatRupiah(d.net)}</td>
                          <td className="py-5 text-right font-black text-slate-900">{formatRupiah(d.pph21)}</td>
                          <td className="py-5 text-right font-black text-slate-900">{formatRupiah(d.bpjsTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-black text-slate-900 tracking-tight">Detail Karyawan</div>
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                        <th className="pb-5 font-bold">Karyawan</th>
                        <th className="pb-5 font-bold">Dept / Posisi</th>
                        <th className="pb-5 font-bold text-right">Gross</th>
                        <th className="pb-5 font-bold text-right">PPh21</th>
                        <th className="pb-5 font-bold text-right">BPJS</th>
                        <th className="pb-5 font-bold text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {run.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="py-5">
                            <div className="font-black text-slate-900">{l.employee.name}</div>
                            <div className="text-xs text-slate-500 font-medium mt-1">{l.employee.employeeNo}</div>
                          </td>
                          <td className="py-5">
                            <div className="text-sm font-bold text-slate-700">
                              {l.employee.department || "-"}
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              {l.employee.position || "-"}
                            </div>
                          </td>
                          <td className="py-5 text-right font-black text-slate-900">
                            {formatRupiah(Number(l.gross))}
                          </td>
                          <td className="py-5 text-right font-black text-slate-900">
                            {formatRupiah(Number(l.pph21))}
                          </td>
                          <td className="py-5 text-right font-black text-slate-900">
                            {formatRupiah(Number(l.bpjsEmployee) + Number(l.bpjsEmployer))}
                          </td>
                          <td className="py-5 text-right font-black text-slate-900">
                            {formatRupiah(Number(l.net))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </RequireErp>
  );
}

