import { Injectable } from "@nestjs/common";
import {
  ListingStatus,
  Prisma,
  ProjectStatus,
  VerificationEntityType,
  VerificationOutcome,
  VerificationStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listMortgageBanks() {
    return this.prisma.mortgageBank.findMany({ orderBy: { name: "asc" } });
  }

  async createMortgageBank(input: { name: string; isSharia?: boolean }) {
    return this.prisma.mortgageBank.create({
      data: {
        name: input.name.trim(),
        slug: slugify(input.name),
        isSharia: input.isSharia ?? false,
      },
    });
  }

  async updateMortgageBank(id: string, input: { name?: string; isSharia?: boolean }) {
    const data: Prisma.MortgageBankUpdateInput = {};
    if (input.name) {
      data.name = input.name.trim();
      data.slug = slugify(input.name);
    }
    if (typeof input.isSharia === "boolean") data.isSharia = input.isSharia;
    return this.prisma.mortgageBank.update({ where: { id }, data });
  }

  async deleteMortgageBank(id: string) {
    await this.prisma.mortgageBank.delete({ where: { id } });
    return { ok: true };
  }

  async listMortgageProducts(bankId?: string) {
    return this.prisma.mortgageProduct.findMany({
      where: {
        ...(bankId ? { bankId } : {}),
      },
      include: { bank: true },
      orderBy: [{ bank: { name: "asc" } }, { name: "asc" }],
    });
  }

  async createMortgageProduct(input: {
    bankId: string;
    name: string;
    defaultInterestRate?: number;
    promoInterestRate?: number;
    fixedPeriodMonths?: number;
    floatingRateAssumption?: number;
    shariaMargin?: number;
    adminFee?: number;
    insuranceRate?: number;
    provisiRate?: number;
    notaryFeeEstimate?: number;
    isActive?: boolean;
  }) {
    return this.prisma.mortgageProduct.create({
      data: {
        bankId: input.bankId,
        name: input.name.trim(),
        slug: slugify(input.name),
        defaultInterestRate: input.defaultInterestRate ?? null,
        promoInterestRate: input.promoInterestRate ?? null,
        fixedPeriodMonths: input.fixedPeriodMonths ?? null,
        floatingRateAssumption: input.floatingRateAssumption ?? null,
        shariaMargin: input.shariaMargin ?? null,
        adminFee: input.adminFee ?? null,
        insuranceRate: input.insuranceRate ?? null,
        provisiRate: input.provisiRate ?? null,
        notaryFeeEstimate: input.notaryFeeEstimate ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateMortgageProduct(id: string, input: Prisma.MortgageProductUpdateInput) {
    return this.prisma.mortgageProduct.update({
      where: { id },
      data: input,
      include: { bank: true },
    });
  }

  async deleteMortgageProduct(id: string) {
    await this.prisma.mortgageProduct.delete({ where: { id } });
    return { ok: true };
  }

  async listDevelopersForReview(input: {
    page: number;
    pageSize: number;
    status?: VerificationStatus;
  }) {
    const skip = (input.page - 1) * input.pageSize;
    const where: Prisma.DeveloperWhereInput = input.status
      ? { verificationStatus: input.status }
      : {};
    const [totalItems, items] = await Promise.all([
      this.prisma.developer.count({ where }),
      this.prisma.developer.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
      items,
    };
  }

  async reviewDeveloper(input: {
    developerId: string;
    reviewerId: string;
    outcome: VerificationOutcome;
    notes?: string;
  }) {
    const developer = await this.prisma.developer.update({
      where: { id: input.developerId },
      data: {
        verificationStatus:
          input.outcome === "approved"
            ? VerificationStatus.approved
            : input.outcome === "rejected"
              ? VerificationStatus.rejected
              : VerificationStatus.revision_requested,
        verificationNotes: input.notes ?? null,
      },
    });

    await this.prisma.verificationRecord.create({
      data: {
        entityType: VerificationEntityType.developer,
        entityId: developer.id,
        reviewerId: input.reviewerId,
        outcome: input.outcome,
        notes: input.notes ?? null,
      },
    });

    return developer;
  }

  async listListingsForReview(input: {
    page: number;
    pageSize: number;
    status?: ListingStatus;
    verificationStatus?: VerificationStatus;
  }) {
    const skip = (input.page - 1) * input.pageSize;
    const where: Prisma.PropertyListingWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.verificationStatus ? { verificationStatus: input.verificationStatus } : {}),
    };

    const [totalItems, items] = await Promise.all([
      this.prisma.propertyListing.count({ where }),
      this.prisma.propertyListing.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          project: { include: { developer: true, location: true } },
          unit: true,
        },
      }),
    ]);

    return {
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
      items,
    };
  }

  async reviewListing(input: {
    listingId: string;
    reviewerId: string;
    outcome: VerificationOutcome;
    notes?: string;
  }) {
    const nextVerificationStatus =
      input.outcome === "approved"
        ? VerificationStatus.approved
        : input.outcome === "rejected"
          ? VerificationStatus.rejected
          : VerificationStatus.revision_requested;

    const nextListingStatus =
      input.outcome === "approved"
        ? ListingStatus.published
        : input.outcome === "rejected"
          ? ListingStatus.rejected
          : ListingStatus.pending;

    const listing = await this.prisma.propertyListing.update({
      where: { id: input.listingId },
      data: {
        verificationStatus: nextVerificationStatus,
        status: nextListingStatus,
      },
      include: {
        project: { include: { developer: true } },
      },
    });

    await this.prisma.verificationRecord.create({
      data: {
        entityType: VerificationEntityType.listing,
        entityId: listing.id,
        reviewerId: input.reviewerId,
        outcome: input.outcome,
        notes: input.notes ?? null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: input.reviewerId,
        action: "listing.review",
        entityType: "PropertyListing",
        entityId: listing.id,
        metadata: {
          outcome: input.outcome,
          nextListingStatus,
          nextVerificationStatus,
        } as any,
      },
    });

    return listing;
  }

  async listProjectsForReview(input: {
    page: number;
    pageSize: number;
    status?: ProjectStatus;
    verificationStatus?: VerificationStatus;
  }) {
    const skip = (input.page - 1) * input.pageSize;
    const where: Prisma.ProjectWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.verificationStatus ? { verificationStatus: input.verificationStatus } : {}),
    };

    const [totalItems, items] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { createdAt: "desc" },
        include: { developer: true, location: true },
      }),
    ]);

    return {
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
      items,
    };
  }

  async reviewProject(input: {
    projectId: string;
    reviewerId: string;
    outcome: VerificationOutcome;
    notes?: string;
  }) {
    const project = await this.prisma.project.update({
      where: { id: input.projectId },
      data: {
        verificationStatus:
          input.outcome === "approved"
            ? VerificationStatus.approved
            : input.outcome === "rejected"
              ? VerificationStatus.rejected
              : VerificationStatus.revision_requested,
      },
      include: { developer: true },
    });

    await this.prisma.verificationRecord.create({
      data: {
        entityType: VerificationEntityType.project,
        entityId: project.id,
        reviewerId: input.reviewerId,
        outcome: input.outcome,
        notes: input.notes ?? null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: input.reviewerId,
        action: "project.review",
        entityType: "Project",
        entityId: project.id,
        metadata: {
          outcome: input.outcome,
          nextVerificationStatus: project.verificationStatus,
        } as any,
      },
    });

    return project;
  }
}
