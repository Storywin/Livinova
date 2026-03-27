import { randomUUID } from "crypto";
import * as fs from "fs";
import { extname, join } from "path";

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ListingStatus, MediaKind, Prisma, PropertyType, VerificationStatus } from "@prisma/client";
import type { Request } from "express";
import { diskStorage } from "multer";

import { PrismaService } from "../prisma/prisma.service";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uploadDir() {
  return join(process.cwd(), "apps", "web", "public", "uploads");
}

export const listingImageStorage = diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    const dir = uploadDir();
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const safeExt = extname(file.originalname || "").slice(0, 12);
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

export const brochureStorage = diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    const dir = uploadDir();
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const safeExt = extname(file.originalname || "").slice(0, 12);
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

@Injectable()
export class DeveloperPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private async myDeveloperIds(userId: string) {
    const rows = await this.prisma.developerUser.findMany({
      where: { userId },
      select: { developerId: true },
    });
    return rows.map((r) => r.developerId);
  }

  private async ensureProjectAccess(userId: string, projectId: string) {
    const developerIds = await this.myDeveloperIds(userId);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, developerId: { in: developerIds } },
      include: { location: true },
    });
    if (!project) throw new ForbiddenException("Tidak memiliki akses ke project ini");
    return project;
  }

  private async ensureListingAccess(userId: string, listingId: string) {
    const developerIds = await this.myDeveloperIds(userId);
    const listing = await this.prisma.propertyListing.findFirst({
      where: { id: listingId, project: { developerId: { in: developerIds } } },
      include: {
        project: { include: { developer: true, location: true } },
        unit: true,
        brochureMediaAsset: true,
        images: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!listing) throw new NotFoundException("Listing tidak ditemukan");
    return listing;
  }

  async listMyProjects(userId: string) {
    const developerIds = await this.myDeveloperIds(userId);
    const projects = await this.prisma.project.findMany({
      where: { developerId: { in: developerIds } },
      orderBy: { createdAt: "desc" },
      include: {
        location: true,
        _count: { select: { listings: true, units: true } },
      },
    });
    return projects.map((p) => ({
      id: p.id,
      developerId: p.developerId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      status: p.status,
      smartReadiness: p.smartReadiness,
      verificationStatus: p.verificationStatus,
      startingPrice: p.startingPrice?.toString() ?? null,
      location: p.location
        ? {
            city: p.location.city,
            area: p.location.area,
            province: p.location.province,
            address: p.location.address,
          }
        : null,
      counts: { listings: p._count.listings, units: p._count.units },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  private async uniqueProjectSlug(base: string) {
    const clean = slugify(base) || "project";
    let attempt = clean;
    for (let i = 0; i < 5; i += 1) {
      const exists = await this.prisma.project.findFirst({
        where: { slug: attempt },
        select: { id: true },
      });
      if (!exists) return attempt;
      attempt = `${clean}-${Math.random().toString(16).slice(2, 8)}`;
    }
    return `${clean}-${Date.now()}`;
  }

  private async ensureDeveloperAccess(userId: string, developerId: string) {
    const membership = await this.prisma.developerUser.findFirst({
      where: { userId, developerId },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException("Tidak memiliki akses ke developer ini");
  }

  async createProject(
    userId: string,
    input: {
      developerId?: string;
      name?: string;
      description?: string;
      status?: string;
      smartReadiness?: string;
      startingPrice?: number;
      location?: { address?: string; city?: string; area?: string; province?: string };
    },
  ) {
    if (!input.developerId) throw new BadRequestException("developerId wajib");
    if (!input.name || !input.name.trim()) throw new BadRequestException("Nama project wajib");
    await this.ensureDeveloperAccess(userId, input.developerId);

    const slug = await this.uniqueProjectSlug(input.name);
    const created = await this.prisma.project.create({
      data: {
        developerId: input.developerId,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        status: (input.status as any) || undefined,
        smartReadiness: (input.smartReadiness as any) || undefined,
        verificationStatus: VerificationStatus.pending,
        startingPrice:
          typeof input.startingPrice === "number" ? new Prisma.Decimal(input.startingPrice) : null,
        location: input.location
          ? {
              create: {
                address: input.location.address?.trim() || null,
                city: input.location.city?.trim() || null,
                area: input.location.area?.trim() || null,
                province: input.location.province?.trim() || null,
              },
            }
          : undefined,
      },
      include: { location: true, _count: { select: { listings: true, units: true } } },
    });

    return {
      id: created.id,
      developerId: created.developerId,
      name: created.name,
      slug: created.slug,
      status: created.status,
      smartReadiness: created.smartReadiness,
      verificationStatus: created.verificationStatus,
      startingPrice: created.startingPrice?.toString() ?? null,
      location: created.location
        ? {
            city: created.location.city,
            area: created.location.area,
            province: created.location.province,
            address: created.location.address,
          }
        : null,
      counts: { listings: created._count.listings, units: created._count.units },
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateProject(
    userId: string,
    projectId: string,
    input: {
      name?: string;
      description?: string;
      status?: string;
      smartReadiness?: string;
      startingPrice?: number | null;
      location?: {
        address?: string | null;
        city?: string | null;
        area?: string | null;
        province?: string | null;
      };
    },
  ) {
    await this.ensureProjectAccess(userId, projectId);
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.name?.trim() || undefined,
        description:
          input.description !== undefined ? input.description?.trim() || null : undefined,
        status: input.status ? (input.status as any) : undefined,
        smartReadiness: input.smartReadiness ? (input.smartReadiness as any) : undefined,
        startingPrice:
          input.startingPrice === undefined
            ? undefined
            : input.startingPrice === null
              ? null
              : new Prisma.Decimal(input.startingPrice),
        location: input.location
          ? {
              upsert: {
                create: {
                  address: input.location.address ?? null,
                  city: input.location.city ?? null,
                  area: input.location.area ?? null,
                  province: input.location.province ?? null,
                },
                update: {
                  address: input.location.address ?? null,
                  city: input.location.city ?? null,
                  area: input.location.area ?? null,
                  province: input.location.province ?? null,
                },
              },
            }
          : undefined,
      },
      include: { location: true, _count: { select: { listings: true, units: true } } },
    });
    return {
      id: updated.id,
      developerId: updated.developerId,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      smartReadiness: updated.smartReadiness,
      verificationStatus: updated.verificationStatus,
      startingPrice: updated.startingPrice?.toString() ?? null,
      location: updated.location
        ? {
            city: updated.location.city,
            area: updated.location.area,
            province: updated.location.province,
            address: updated.location.address,
          }
        : null,
      counts: { listings: updated._count.listings, units: updated._count.units },
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async listMyListings(userId: string, input?: { projectId?: string }) {
    const developerIds = await this.myDeveloperIds(userId);
    const listings = await this.prisma.propertyListing.findMany({
      where: {
        ...(input?.projectId ? { projectId: input.projectId } : {}),
        project: { developerId: { in: developerIds } },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        project: { include: { location: true } },
        unit: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, include: { mediaAsset: true } },
      },
    });

    return listings.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      status: l.status,
      verificationStatus: l.verificationStatus,
      price: l.price?.toString() ?? null,
      startingPrice: l.startingPrice?.toString() ?? null,
      project: {
        id: l.project.id,
        name: l.project.name,
        slug: l.project.slug,
        location: l.project.location
          ? {
              city: l.project.location.city,
              area: l.project.location.area,
              province: l.project.location.province,
            }
          : null,
      },
      unit: l.unit
        ? {
            id: l.unit.id,
            title: l.unit.title,
            propertyType: l.unit.propertyType,
            bedrooms: l.unit.bedrooms,
            bathrooms: l.unit.bathrooms,
            buildingSize: l.unit.buildingSize,
            landSize: l.unit.landSize,
          }
        : null,
      thumbnail: l.images[0]?.mediaAsset?.url ?? null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));
  }

  private async uniqueListingSlug(base: string) {
    const clean = slugify(base) || "listing";
    let attempt = clean;
    for (let i = 0; i < 5; i += 1) {
      const exists = await this.prisma.propertyListing.findFirst({
        where: { slug: attempt },
        select: { id: true },
      });
      if (!exists) return attempt;
      attempt = `${clean}-${Math.random().toString(16).slice(2, 8)}`;
    }
    return `${clean}-${Date.now()}`;
  }

  private async uniqueUnitSlug(projectId: string, base: string) {
    const clean = slugify(base) || "unit";
    let attempt = clean;
    for (let i = 0; i < 5; i += 1) {
      const exists = await this.prisma.propertyUnit.findFirst({
        where: { projectId, slug: attempt },
        select: { id: true },
      });
      if (!exists) return attempt;
      attempt = `${clean}-${Math.random().toString(16).slice(2, 8)}`;
    }
    return `${clean}-${Date.now()}`;
  }

  async createListing(
    userId: string,
    input: {
      projectId?: string;
      title?: string;
      description?: string;
      price?: number;
      startingPrice?: number;
    },
  ) {
    if (!input.projectId) throw new BadRequestException("projectId wajib");
    if (!input.title || !input.title.trim()) throw new BadRequestException("Judul listing wajib");
    await this.ensureProjectAccess(userId, input.projectId);
    const slug = await this.uniqueListingSlug(input.title);

    const created = await this.prisma.propertyListing.create({
      data: {
        projectId: input.projectId,
        title: input.title.trim(),
        slug,
        status: ListingStatus.draft,
        verificationStatus: VerificationStatus.pending,
        description: input.description?.trim() || null,
        price: typeof input.price === "number" ? new Prisma.Decimal(input.price) : null,
        startingPrice:
          typeof input.startingPrice === "number" ? new Prisma.Decimal(input.startingPrice) : null,
      },
      include: {
        project: { include: { location: true } },
        unit: true,
        images: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    return {
      id: created.id,
      title: created.title,
      slug: created.slug,
      status: created.status,
      verificationStatus: created.verificationStatus,
      price: created.price?.toString() ?? null,
      startingPrice: created.startingPrice?.toString() ?? null,
      description: created.description,
      project: {
        id: created.project.id,
        name: created.project.name,
        slug: created.project.slug,
        location: created.project.location
          ? {
              city: created.project.location.city,
              area: created.project.location.area,
              province: created.project.location.province,
            }
          : null,
      },
      unit: null,
      images: [],
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async getListing(userId: string, listingId: string) {
    const listing = await this.ensureListingAccess(userId, listingId);
    return {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      status: listing.status,
      verificationStatus: listing.verificationStatus,
      description: listing.description,
      price: listing.price?.toString() ?? null,
      startingPrice: listing.startingPrice?.toString() ?? null,
      brochureUrl: listing.brochureMediaAsset?.url ?? null,
      project: {
        id: listing.project.id,
        name: listing.project.name,
        slug: listing.project.slug,
        location: listing.project.location
          ? {
              city: listing.project.location.city,
              area: listing.project.location.area,
              province: listing.project.location.province,
            }
          : null,
      },
      unit: listing.unit
        ? {
            id: listing.unit.id,
            title: listing.unit.title,
            propertyType: listing.unit.propertyType,
            bedrooms: listing.unit.bedrooms,
            bathrooms: listing.unit.bathrooms,
            buildingSize: listing.unit.buildingSize,
            landSize: listing.unit.landSize,
            price: listing.unit.price?.toString() ?? null,
            startingPrice: listing.unit.startingPrice?.toString() ?? null,
            availableUnits: listing.unit.availableUnits,
          }
        : null,
      images: listing.images.map((img) => ({
        id: img.id,
        url: img.mediaAsset.url,
        mediaAssetId: img.mediaAssetId,
        kind: img.mediaAsset.kind,
        sortOrder: img.sortOrder,
      })),
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  async updateListing(
    userId: string,
    listingId: string,
    input: {
      title?: string;
      description?: string;
      price?: number | null;
      startingPrice?: number | null;
    },
  ) {
    const listing = await this.ensureListingAccess(userId, listingId);
    if (listing.status === ListingStatus.published) {
      throw new ForbiddenException("Listing sudah published dan tidak dapat diubah dari portal");
    }
    const updated = await this.prisma.propertyListing.update({
      where: { id: listingId },
      data: {
        title: input.title?.trim() || undefined,
        description:
          input.description !== undefined ? input.description?.trim() || null : undefined,
        price:
          input.price === undefined
            ? undefined
            : input.price === null
              ? null
              : new Prisma.Decimal(input.price),
        startingPrice:
          input.startingPrice === undefined
            ? undefined
            : input.startingPrice === null
              ? null
              : new Prisma.Decimal(input.startingPrice),
      },
    });
    return {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      status: updated.status,
      verificationStatus: updated.verificationStatus,
      description: updated.description,
      price: updated.price?.toString() ?? null,
      startingPrice: updated.startingPrice?.toString() ?? null,
      updatedAt: updated.updatedAt,
    };
  }

  async upsertListingUnit(
    userId: string,
    listingId: string,
    input: {
      title?: string;
      propertyType?: "rumah" | "apartemen" | "ruko" | "villa" | "tanah";
      bedrooms?: number | null;
      bathrooms?: number | null;
      buildingSize?: number | null;
      landSize?: number | null;
      price?: number | null;
      startingPrice?: number | null;
      availableUnits?: number | null;
    },
  ) {
    const listing = await this.ensureListingAccess(userId, listingId);
    if (listing.status === ListingStatus.published) {
      throw new ForbiddenException("Listing sudah published dan tidak dapat diubah dari portal");
    }

    const unitTitle = input.title?.trim() || listing.title;
    const propertyType = (input.propertyType as PropertyType | undefined) ?? PropertyType.rumah;

    if (listing.unitId) {
      const updated = await this.prisma.propertyUnit.update({
        where: { id: listing.unitId },
        data: {
          title: unitTitle,
          propertyType,
          bedrooms: input.bedrooms ?? null,
          bathrooms: input.bathrooms ?? null,
          buildingSize: input.buildingSize ?? null,
          landSize: input.landSize ?? null,
          price:
            input.price === undefined
              ? undefined
              : input.price === null
                ? null
                : new Prisma.Decimal(input.price),
          startingPrice:
            input.startingPrice === undefined
              ? undefined
              : input.startingPrice === null
                ? null
                : new Prisma.Decimal(input.startingPrice),
          availableUnits: input.availableUnits ?? undefined,
        },
      });
      return {
        id: updated.id,
        title: updated.title,
        propertyType: updated.propertyType,
        bedrooms: updated.bedrooms,
        bathrooms: updated.bathrooms,
        buildingSize: updated.buildingSize,
        landSize: updated.landSize,
        price: updated.price?.toString() ?? null,
        startingPrice: updated.startingPrice?.toString() ?? null,
        availableUnits: updated.availableUnits,
        updatedAt: updated.updatedAt,
      };
    }

    const slug = await this.uniqueUnitSlug(listing.projectId, unitTitle);
    const created = await this.prisma.propertyUnit.create({
      data: {
        projectId: listing.projectId,
        title: unitTitle,
        slug,
        propertyType,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        buildingSize: input.buildingSize ?? null,
        landSize: input.landSize ?? null,
        price:
          input.price === null || input.price === undefined
            ? null
            : new Prisma.Decimal(input.price),
        startingPrice:
          input.startingPrice === null || input.startingPrice === undefined
            ? null
            : new Prisma.Decimal(input.startingPrice),
        availableUnits: input.availableUnits ?? 0,
      },
      select: {
        id: true,
        title: true,
        propertyType: true,
        bedrooms: true,
        bathrooms: true,
        buildingSize: true,
        landSize: true,
        price: true,
        startingPrice: true,
        availableUnits: true,
        updatedAt: true,
      },
    });

    await this.prisma.propertyListing.update({
      where: { id: listing.id },
      data: { unitId: created.id },
    });

    return {
      id: created.id,
      title: created.title,
      propertyType: created.propertyType,
      bedrooms: created.bedrooms,
      bathrooms: created.bathrooms,
      buildingSize: created.buildingSize,
      landSize: created.landSize,
      price: created.price?.toString() ?? null,
      startingPrice: created.startingPrice?.toString() ?? null,
      availableUnits: created.availableUnits,
      updatedAt: created.updatedAt,
    };
  }

  async uploadBrochure(userId: string, listingId: string, file: Express.Multer.File) {
    const listing = await this.ensureListingAccess(userId, listingId);
    if (!file) throw new BadRequestException("File wajib");
    if (!file.mimetype?.includes("pdf")) throw new BadRequestException("Brochure harus PDF");

    const publicUrl = `/uploads/${file.filename}`;
    const media = await this.prisma.mediaAsset.create({
      data: {
        kind: MediaKind.brochure,
        bucket: "web-public",
        key: `uploads/${file.filename}`,
        url: publicUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      select: { id: true, url: true, kind: true },
    });

    await this.prisma.propertyListing.update({
      where: { id: listing.id },
      data: { brochureMediaAssetId: media.id },
      select: { id: true },
    });

    return { id: media.id, url: media.url, kind: media.kind };
  }

  async submitListing(userId: string, listingId: string) {
    const listing = await this.ensureListingAccess(userId, listingId);
    if (listing.status === ListingStatus.published) return listing;
    const updated = await this.prisma.propertyListing.update({
      where: { id: listingId },
      data: { status: ListingStatus.pending, verificationStatus: VerificationStatus.pending },
      select: { id: true, status: true, verificationStatus: true, updatedAt: true },
    });
    return updated;
  }

  async addListingImage(userId: string, listingId: string, file: Express.Multer.File) {
    const listing = await this.ensureListingAccess(userId, listingId);
    if (!file) throw new BadRequestException("File wajib");

    const publicUrl = `/uploads/${file.filename}`;
    const media = await this.prisma.mediaAsset.create({
      data: {
        kind: "image",
        bucket: "web-public",
        key: `uploads/${file.filename}`,
        url: publicUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      select: { id: true, url: true, kind: true },
    });

    const last = await this.prisma.propertyImage.findFirst({
      where: { listingId: listing.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (last?.sortOrder ?? 0) + 1;

    const img = await this.prisma.propertyImage.create({
      data: { listingId: listing.id, mediaAssetId: media.id, sortOrder },
      select: { id: true, sortOrder: true, mediaAssetId: true },
    });

    return {
      id: img.id,
      url: media.url,
      mediaAssetId: media.id,
      kind: media.kind,
      sortOrder: img.sortOrder,
    };
  }

  async deleteListingImage(userId: string, listingId: string, imageId: string) {
    await this.ensureListingAccess(userId, listingId);
    await this.prisma.propertyImage.delete({ where: { id: imageId } });
    return { ok: true };
  }
}
