import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma, VerificationStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMy(userId: string) {
    const rows = await this.prisma.developerUser.findMany({
      where: { userId },
      include: { developer: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.developer.id,
      name: r.developer.name,
      slug: r.developer.slug,
      profileTemplate: r.developer.profileTemplate,
      verificationStatus: r.developer.verificationStatus,
      createdAt: r.developer.createdAt,
      updatedAt: r.developer.updatedAt,
    }));
  }

  async updateMyProfileTemplate(
    userId: string,
    input: { developerId: string; profileTemplate: string },
  ) {
    const profileTemplate = input.profileTemplate.trim().toLowerCase();
    const allowed = new Set(["classic", "aurora", "skyline"]);
    if (!allowed.has(profileTemplate)) throw new BadRequestException("Template tidak valid");

    const membership = await this.prisma.developerUser.findFirst({
      where: { userId, developerId: input.developerId },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException("Tidak memiliki akses ke developer ini");

    const updated = await this.prisma.developer.update({
      where: { id: input.developerId },
      data: { profileTemplate },
      select: { id: true, slug: true, name: true, profileTemplate: true, updatedAt: true },
    });
    return updated;
  }

  async listPublic(input: { q?: string; page?: number; pageSize?: number }) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 12;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DeveloperWhereInput = {
      verificationStatus: VerificationStatus.approved,
      ...(input.q && input.q.trim()
        ? {
            OR: [
              { name: { contains: input.q.trim(), mode: "insensitive" } },
              { city: { contains: input.q.trim(), mode: "insensitive" } },
              { province: { contains: input.q.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [totalItems, items] = await Promise.all([
      this.prisma.developer.count({ where }),
      this.prisma.developer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { projects: true },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      page,
      pageSize,
      totalItems,
      totalPages,
      items: items.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        profileTemplate: d.profileTemplate,
        description: d.description,
        city: d.city,
        province: d.province,
        website: d.website,
        verificationStatus: d.verificationStatus,
        projectCount: d._count.projects,
        createdAt: d.createdAt,
      })),
    };
  }

  async getPublicBySlug(slug: string) {
    const developer = await this.prisma.developer.findFirst({
      where: { slug, verificationStatus: VerificationStatus.approved },
      include: {
        projects: {
          where: { verificationStatus: VerificationStatus.approved },
          orderBy: { createdAt: "desc" },
          include: { location: true },
        },
      },
    });

    if (!developer) return null;

    return {
      id: developer.id,
      name: developer.name,
      slug: developer.slug,
      profileTemplate: developer.profileTemplate,
      description: developer.description,
      website: developer.website,
      email: developer.email,
      phone: developer.phone,
      address: developer.address,
      city: developer.city,
      province: developer.province,
      contactPersonName: developer.contactPersonName,
      contactPersonEmail: developer.contactPersonEmail,
      contactPersonPhone: developer.contactPersonPhone,
      verificationStatus: developer.verificationStatus,
      projects: developer.projects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        smartReadiness: p.smartReadiness,
        verificationStatus: p.verificationStatus,
        startingPrice: p.startingPrice?.toString() ?? null,
        location: p.location
          ? {
              city: p.location.city,
              area: p.location.area,
              province: p.location.province,
            }
          : null,
      })),
      createdAt: developer.createdAt,
      updatedAt: developer.updatedAt,
    };
  }

  async applyPublic(input: {
    name: string;
    description?: string;
    companyType?: string;
    establishedYear?: string;
    portfolioUrl?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    contactPersonName?: string;
    contactPersonRole?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
  }) {
    const baseSlug = slugify(input.name);
    let slug = baseSlug;

    const exists = await this.prisma.developer.findUnique({ where: { slug } });
    if (exists) {
      const suffix = Math.random().toString(36).slice(2, 7);
      slug = `${baseSlug}-${suffix}`;
    }

    const developer = await this.prisma.developer.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        companyType: input.companyType?.trim() || null,
        establishedYear: input.establishedYear?.trim()
          ? Number(input.establishedYear.trim())
          : null,
        portfolioUrl: input.portfolioUrl?.trim() || null,
        website: input.website?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        province: input.province?.trim() || null,
        contactPersonName: input.contactPersonName?.trim() || null,
        contactPersonRole: input.contactPersonRole?.trim() || null,
        contactPersonEmail: input.contactPersonEmail?.trim() || null,
        contactPersonPhone: input.contactPersonPhone?.trim() || null,
        verificationStatus: VerificationStatus.pending,
      },
    });

    return {
      id: developer.id,
      name: developer.name,
      slug: developer.slug,
      verificationStatus: developer.verificationStatus,
      createdAt: developer.createdAt,
    };
  }
}
