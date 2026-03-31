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
  periodId: string;
  status: string;
  grossTotal: string;
  deductionsTotal: string;
  netTotal: string;
  period: PayrollPeriod;
  lines: PayrollLine[];
};

export default function PayslipPage() {
  const params = useSearchParams();
  const runId = params.get("runId") || "";
  const employeeId = params.get("employeeId") || "";

  const { data: run, isLoading, isError } = useQuery({
    queryKey: ["erp-payroll-run", runId],
    queryFn: () => apiFetch<PayrollRun>(`/api/erp/payroll/runs/${runId}`),
    enabled: runId.length > 0,
  });

  const selectedLine = useMemo(() => {
    if (!run) return null;
    if (!employeeId) return null;
    return run.lines.find((l) => l.employeeId === employeeId) || null;
  }, [employeeId, run]);

  return (
    <RequireErp allowedRoles={["tenant_admin"]}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black tracking-tight">Payslip</div>
              <div className="text-sm text-slate-500 font-medium">
                {run?.period?.name ? `Periode: ${run.period.name}` : "Periode Payroll"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => window.close()}>
                Tutup
              </Button>
              <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700" onClick={() => window.print()}>
                Print
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
              <div className="text-sm font-bold text-rose-600">Gagal memuat payslip</div>
            </Card>
          )}

          {run && !employeeId && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Pilih Karyawan
              </div>
              <div className="mt-6 grid gap-3">
                {run.lines.map((l) => (
                  <a
                    key={l.id}
                    href={`/erp/payroll/payslip?runId=${run.id}&employeeId=${l.employeeId}`}
                    className="block p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900 truncate">
                          {l.employee.name}{" "}
                          <span className="text-slate-400 text-xs font-black tracking-widest">
                            • {l.employee.employeeNo}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-2">
                          {(l.employee.department || "-") + (l.employee.position ? ` • ${l.employee.position}` : "")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Net</div>
                        <div className="text-sm font-black text-slate-900">{formatRupiah(Number(l.net))}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {run && selectedLine && (
            <Card className="rounded-[2rem] p-8 border-slate-200 bg-white">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Karyawan</div>
                  <div className="text-xl font-black text-slate-900 tracking-tight mt-2">
                    {selectedLine.employee.name}
                  </div>
                  <div className="text-sm text-slate-500 font-medium mt-2">
                    {selectedLine.employee.employeeNo}
                    {selectedLine.employee.department ? ` • ${selectedLine.employee.department}` : ""}
                    {selectedLine.employee.position ? ` • ${selectedLine.employee.position}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net Pay</div>
                  <div className="text-2xl font-black text-blue-600 tracking-tight mt-2">
                    {formatRupiah(Number(selectedLine.net))}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Earnings</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Gaji + Tunjangan</span>
                      <span className="font-black text-slate-900">{formatRupiah(Number(selectedLine.gross))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Tunjangan</span>
                      <span className="font-black text-slate-900">{formatRupiah(Number(selectedLine.allowance))}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deductions</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">PPh 21</span>
                      <span className="font-black text-slate-900">{formatRupiah(Number(selectedLine.pph21))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">BPJS (Karyawan)</span>
                      <span className="font-black text-slate-900">
                        {formatRupiah(Number(selectedLine.bpjsEmployee))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">BPJS (Perusahaan)</span>
                      <span className="font-black text-slate-900">
                        {formatRupiah(Number(selectedLine.bpjsEmployer))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </RequireErp>
  );
}

