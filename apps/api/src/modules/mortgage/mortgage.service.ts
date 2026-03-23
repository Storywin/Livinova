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
      floatingRateAssumption: p.floatingRateAssumption?.toString() ?? null,
      shariaMargin: p.shariaMargin?.toString() ?? null,
      adminFee: p.adminFee?.toString() ?? null,
      insuranceRate: p.insuranceRate?.toString() ?? null,
      provisiRate: p.provisiRate?.toString() ?? null,
      notaryFeeEstimate: p.notaryFeeEstimate?.toString() ?? null,
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
    let assumption: Record<string, unknown> = {};

    if (product.bank.isSharia) {
      const margin = toNumber(product.shariaMargin);
      monthlyInstallment = monthlyPaymentShariaFixed(financing, margin, input.tenorMonths);
      assumption = {
        mode: "sharia_fixed",
        annualMarginPercent: margin,
      };
    } else {
      const annualRate =
        toNumber(product.promoInterestRate) || toNumber(product.defaultInterestRate);
      monthlyInstallment = monthlyPaymentAnnuity(financing, annualRate, input.tenorMonths);
      assumption = {
        mode: "annuity",
        annualInterestRatePercent: annualRate,
        fixedPeriodMonths: product.fixedPeriodMonths,
        floatingRateAssumption: toNumber(product.floatingRateAssumption),
      };
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
