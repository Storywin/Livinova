import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { MortgageSimulateDto } from "./dto/simulate.dto";

function toNumber(v: Prisma.Decimal | number | null | undefined) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  return Number(v.toString());
}

function roundCurrency(v: number) {
  return Math.round(v);
}

function monthlyPaymentAnnuity(principal: number, annualRatePercent: number, months: number) {
  if (months <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r <= 0) return principal / months;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

type RatePhase = { months: number; ratePercent: number; kind: string };
type ScheduleItem = { months: number; monthly: number; ratePercent: number; kind: string };

function parseRateSchedule(value: unknown, defaultKind: string): RatePhase[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;
      const months = Number(obj.months);
      const ratePercent = Number(obj.ratePercent ?? obj.rate);
      const kind = typeof obj.kind === "string" ? obj.kind : defaultKind;
      if (!Number.isFinite(months) || months <= 0) return null;
      if (!Number.isFinite(ratePercent) || ratePercent <= 0) return null;
      return { months, ratePercent, kind };
    })
    .filter((x): x is RatePhase => Boolean(x));
}

function remainingPrincipalAfterPayments(
  principal: number,
  annualRatePercent: number,
  monthlyPayment: number,
  paymentsMade: number,
) {
  const r = annualRatePercent / 100 / 12;
  if (!Number.isFinite(r) || r <= 0) {
    return Math.max(0, principal - monthlyPayment * paymentsMade);
  }
  const pow = Math.pow(1 + r, paymentsMade);
  const remaining = principal * pow - monthlyPayment * ((pow - 1) / r);
  return Math.max(0, remaining);
}

function monthlyPaymentShariaFixed(principal: number, annualMarginPercent: number, months: number) {
  if (months <= 0) return 0;
  const years = months / 12;
  const total = principal * (1 + (annualMarginPercent / 100) * years);
  return total / months;
}

@Injectable()
export class MortgageService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicBanks() {
    const banks = await this.prisma.mortgageBank.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });

    return banks.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      isSharia: b.isSharia,
      productCount: b._count.products,
    }));
  }

  async listPublicProducts(input: { bankSlug?: string }) {
    const where: Prisma.MortgageProductWhereInput = {
      isActive: true,
      ...(input.bankSlug ? { bank: { slug: input.bankSlug } } : {}),
    };

    const products = await this.prisma.mortgageProduct.findMany({
      where,
      orderBy: [{ bank: { name: "asc" } }, { name: "asc" }],
      include: { bank: true },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      bank: {
        id: p.bank.id,
        name: p.bank.name,
        slug: p.bank.slug,
        isSharia: p.bank.isSharia,
      },
      defaultInterestRate: p.defaultInterestRate?.toString() ?? null,
      promoInterestRate: p.promoInterestRate?.toString() ?? null,
      fixedPeriodMonths: p.fixedPeriodMonths,
      minTenorMonths: p.minTenorMonths ?? null,
      rateSchedule: p.rateSchedule ?? null,
      floatingRateAssumption: p.floatingRateAssumption?.toString() ?? null,
      shariaMargin: p.shariaMargin?.toString() ?? null,
      adminFee: p.adminFee?.toString() ?? null,
      insuranceRate: p.insuranceRate?.toString() ?? null,
      provisiRate: p.provisiRate?.toString() ?? null,
      notaryFeeEstimate: p.notaryFeeEstimate?.toString() ?? null,
      sourceUrl: p.sourceUrl ?? null,
      sourceTitle: p.sourceTitle ?? null,
      sourceCheckedAt: p.sourceCheckedAt ? p.sourceCheckedAt.toISOString() : null,
      notes: p.notes ?? null,
      isActive: p.isActive,
    }));
  }

  async simulatePublic(input: MortgageSimulateDto) {
    if (input.downPayment > input.propertyPrice) {
      throw new BadRequestException("Uang muka tidak boleh lebih besar dari harga properti");
    }

    const product = await this.prisma.mortgageProduct.findFirst({
      where: { id: input.productId, isActive: true },
      include: { bank: true },
    });

    if (!product) throw new BadRequestException("Produk KPR tidak ditemukan");
    if (product.minTenorMonths && input.tenorMonths < product.minTenorMonths) {
      throw new BadRequestException(
        `Tenor minimum untuk produk ini adalah ${product.minTenorMonths} bulan`,
      );
    }

    const financing = Math.max(0, input.propertyPrice - input.downPayment);

    const adminFee = toNumber(product.adminFee);
    const notaryFeeEstimate = toNumber(product.notaryFeeEstimate);
    const provisiRate = toNumber(product.provisiRate);
    const insuranceRate = toNumber(product.insuranceRate);
    const additionalFees = input.additionalFees ?? 0;

    const provisi = financing * (provisiRate / 100);
    const insurance = financing * (insuranceRate / 100);

    const totalFees = adminFee + notaryFeeEstimate + provisi + insurance + additionalFees;
    const totalDownPayment = input.downPayment + totalFees;

    let monthlyInstallment = 0;
    let laterMonthlyInstallment: number | null = null;
    const schedule: ScheduleItem[] = [];
    let assumption: Record<string, unknown> = {};

    if (product.bank.isSharia) {
      const scheduleJson = product.rateSchedule;
      const hasSchedule = Array.isArray(scheduleJson) && scheduleJson.length > 0;

      if (hasSchedule) {
        let remainingPrincipal = financing;
        let remainingTenor = input.tenorMonths;

        const phases = parseRateSchedule(scheduleJson, "sharia_step");

        for (const phase of phases) {
          if (remainingTenor <= 0) break;
          const phaseMonths = Math.min(phase.months, remainingTenor);
          const pmt = monthlyPaymentAnnuity(remainingPrincipal, phase.ratePercent, remainingTenor);
          schedule.push({
            months: phaseMonths,
            monthly: roundCurrency(pmt),
            ratePercent: phase.ratePercent,
            kind: phase.kind,
          });
          remainingPrincipal = remainingPrincipalAfterPayments(
            remainingPrincipal,
            phase.ratePercent,
            pmt,
            phaseMonths,
          );
          remainingTenor -= phaseMonths;
        }

        monthlyInstallment = schedule[0]?.monthly ?? 0;
        laterMonthlyInstallment =
          schedule.length > 1 ? (schedule[schedule.length - 1]?.monthly ?? null) : null;

        assumption = {
          mode: "sharia_multi_phase_pricing",
        };
      } else {
        const margin = toNumber(product.shariaMargin);
        monthlyInstallment = monthlyPaymentShariaFixed(financing, margin, input.tenorMonths);
        assumption = {
          mode: "sharia_fixed",
          annualMarginPercent: margin,
        };
        schedule.push({
          months: input.tenorMonths,
          monthly: roundCurrency(monthlyInstallment),
          ratePercent: margin,
          kind: "sharia_fixed",
        });
      }
    } else {
      const floatRate = toNumber(product.floatingRateAssumption);
      const scheduleJson = product.rateSchedule;
      const hasSchedule = Array.isArray(scheduleJson) && scheduleJson.length > 0;

      if (hasSchedule) {
        let remainingPrincipal = financing;
        let remainingTenor = input.tenorMonths;

        const phases = parseRateSchedule(scheduleJson, "fixed");

        for (const phase of phases) {
          if (remainingTenor <= 0) break;
          const phaseMonths = Math.min(phase.months, remainingTenor);
          const pmt = monthlyPaymentAnnuity(remainingPrincipal, phase.ratePercent, remainingTenor);
          schedule.push({
            months: phaseMonths,
            monthly: roundCurrency(pmt),
            ratePercent: phase.ratePercent,
            kind: phase.kind,
          });
          remainingPrincipal = remainingPrincipalAfterPayments(
            remainingPrincipal,
            phase.ratePercent,
            pmt,
            phaseMonths,
          );
          remainingTenor -= phaseMonths;
        }

        if (remainingTenor > 0) {
          const assumed = floatRate || schedule[schedule.length - 1]?.ratePercent || 0;
          const pmt = monthlyPaymentAnnuity(remainingPrincipal, assumed, remainingTenor);
          schedule.push({
            months: remainingTenor,
            monthly: roundCurrency(pmt),
            ratePercent: assumed,
            kind: floatRate ? "floating_assumption" : "post_fixed_assumption_same_rate",
          });
        }

        monthlyInstallment = schedule[0]?.monthly ?? 0;
        laterMonthlyInstallment =
          schedule.length > 1 ? (schedule[schedule.length - 1]?.monthly ?? null) : null;

        assumption = {
          mode: "annuity_multi_phase",
          floatingRateAssumptionPercent: floatRate || null,
        };
      } else {
        const fixedMonths = product.fixedPeriodMonths ?? 0;
        const fixedRate =
          toNumber(product.promoInterestRate) || toNumber(product.defaultInterestRate);
        const assumedFloat = floatRate || fixedRate;

        if (fixedMonths > 0 && fixedMonths < input.tenorMonths) {
          const pmtFixed = monthlyPaymentAnnuity(financing, fixedRate, input.tenorMonths);
          monthlyInstallment = pmtFixed;
          const remainingPrincipal = remainingPrincipalAfterPayments(
            financing,
            fixedRate,
            pmtFixed,
            fixedMonths,
          );
          const remainingMonths = input.tenorMonths - fixedMonths;
          laterMonthlyInstallment = monthlyPaymentAnnuity(
            remainingPrincipal,
            assumedFloat,
            remainingMonths,
          );
          schedule.push({
            months: fixedMonths,
            monthly: roundCurrency(pmtFixed),
            ratePercent: fixedRate,
            kind: "fixed",
          });
          schedule.push({
            months: remainingMonths,
            monthly: roundCurrency(laterMonthlyInstallment),
            ratePercent: assumedFloat,
            kind: "floating_assumption",
          });
          assumption = {
            mode: "annuity_two_phase",
            fixedRatePercent: fixedRate,
            fixedPeriodMonths: fixedMonths,
            floatingRateAssumptionPercent: assumedFloat,
          };
        } else {
          const annualRate = fixedRate;
          monthlyInstallment = monthlyPaymentAnnuity(financing, annualRate, input.tenorMonths);
          schedule.push({
            months: input.tenorMonths,
            monthly: roundCurrency(monthlyInstallment),
            ratePercent: annualRate,
            kind: "annuity",
          });
          assumption = {
            mode: "annuity",
            annualInterestRatePercent: annualRate,
            fixedPeriodMonths: product.fixedPeriodMonths,
            floatingRateAssumption: toNumber(product.floatingRateAssumption),
          };
        }
      }
    }

    monthlyInstallment = roundCurrency(monthlyInstallment);

    const estimatedTotalPayment = roundCurrency(
      monthlyInstallment * input.tenorMonths + totalFees + input.downPayment,
    );

    const affordabilityRatio =
      input.monthlyIncome && input.monthlyIncome > 0
        ? Number((monthlyInstallment / input.monthlyIncome).toFixed(4))
        : null;

    const result = {
      bank: {
        id: product.bank.id,
        name: product.bank.name,
        slug: product.bank.slug,
        isSharia: product.bank.isSharia,
      },
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      },
      inputs: {
        propertyPrice: input.propertyPrice,
        downPayment: input.downPayment,
        tenorMonths: input.tenorMonths,
        monthlyIncome: input.monthlyIncome ?? null,
        additionalFees: input.additionalFees ?? null,
      },
      derived: {
        financing: roundCurrency(financing),
        fees: {
          adminFee: roundCurrency(adminFee),
          notaryFeeEstimate: roundCurrency(notaryFeeEstimate),
          provisiRatePercent: provisiRate,
          provisi: roundCurrency(provisi),
          insuranceRatePercent: insuranceRate,
          insurance: roundCurrency(insurance),
          additionalFees: roundCurrency(additionalFees),
          totalFees: roundCurrency(totalFees),
        },
        totalDownPayment: roundCurrency(totalDownPayment),
      },
      outputs: {
        monthlyInstallment,
        laterMonthlyInstallment: laterMonthlyInstallment
          ? roundCurrency(laterMonthlyInstallment)
          : null,
        schedule,
        estimatedTotalPayment,
        affordabilityRatio,
      },
      assumption,
    };

    await this.prisma.mortgageSimulation.create({
      data: {
        listingId: input.listingId ?? null,
        bankId: product.bankId,
        productId: product.id,
        inputs: result.inputs as any,
        results: result as any,
      },
    });

    return result;
  }
}
