import { Injectable } from "@nestjs/common";
import { ListingStatus, Prisma, VerificationStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { PublicListingsQueryDto } from "./dto/public-listings.query";

function normalize(input: string) {
  return input.trim();
}

function parseCsv(input?: string) {
  if (!input) return [];
  return input
    .split(",")
    .map((v) => normalize(v))
    .filter((v) => v.length > 0);
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchPublic(query: PublicListingsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const skip = (page - 1) * pageSize;

    const smartFeatureSlugs = parseCsv(query.smartFeatures);

    const andWhere: Prisma.PropertyListingWhereInput[] = [
      { status: ListingStatus.published },
      { verificationStatus: VerificationStatus.approved },
      {
        project: {
          verificationStatus: VerificationStatus.approved,
          developer: { verificationStatus: VerificationStatus.approved },
        },
      },
    ];

    if (query.q && query.q.trim()) {
      const q = normalize(query.q);
      andWhere.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { project: { name: { contains: q, mode: "insensitive" } } },
          { project: { developer: { name: { contains: q, mode: "insensitive" } } } },
          { project: { location: { city: { contains: q, mode: "insensitive" } } } },
          { project: { location: { area: { contains: q, mode: "insensitive" } } } },
        ],
      });
    }

    if (query.city) {
      const city = normalize(query.city);
      andWhere.push({ project: { location: { city: { contains: city, mode: "insensitive" } } } });
    }

    if (query.area) {
      const area = normalize(query.area);
      andWhere.push({ project: { location: { area: { contains: area, mode: "insensitive" } } } });
    }

    if (query.developerSlug) {
      andWhere.push({ project: { developer: { slug: query.developerSlug } } });
    }

    if (query.projectStatus) {
      andWhere.push({ project: { status: query.projectStatus as any } });
    }

    if (query.propertyType) {
      andWhere.push({ unit: { propertyType: query.propertyType as any } });
    }

    if (typeof query.bedrooms === "number") {
      andWhere.push({ unit: { bedrooms: query.bedrooms } });
    }

    if (typeof query.minPrice === "number") {
      andWhere.push({
        OR: [{ price: { gte: query.minPrice } }, { startingPrice: { gte: query.minPrice } }],
      });
    }

    if (typeof query.maxPrice === "number") {
      andWhere.push({
        OR: [{ price: { lte: query.maxPrice } }, { startingPrice: { lte: query.maxPrice } }],
      });
    }

    if (smartFeatureSlugs.length > 0) {
      andWhere.push({
        smartFeatures: {
          some: {
            smartFeature: {
              slug: { in: smartFeatureSlugs },
            },
          },
        },
      });
    }

    const where: Prisma.PropertyListingWhereInput = andWhere.length > 0 ? { AND: andWhere } : {};

    const orderBy: Prisma.PropertyListingOrderByWithRelationInput[] = (() => {
      switch (query.sort) {
        case "price_asc":
          return [{ price: "asc" }, { startingPrice: "asc" }, { createdAt: "desc" }];
        case "price_desc":
          return [{ price: "desc" }, { startingPrice: "desc" }, { createdAt: "desc" }];
        case "featured":
          return [{ featured: "desc" }, { sponsored: "desc" }, { createdAt: "desc" }];
        case "newest":
        default:
          return [{ createdAt: "desc" }];
      }
    })();

    const [totalItems, items] = await Promise.all([
      this.prisma.propertyListing.count({ where }),
      this.prisma.propertyListing.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          unit: true,
          project: {
            include: {
              developer: true,
              location: true,
            },
          },
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            include: { mediaAsset: true },
          },
          smartFeatures: {
            include: { smartFeature: true },
          },
          ratings: {
            select: { rating: true },
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
      items: items.map((l) => {
        const ratingCount = l.ratings.length;
        const averageRating =
          ratingCount > 0 ? l.ratings.reduce((acc, r) => acc + r.rating, 0) / ratingCount : 0;

        return {
          id: l.id,
          title: l.title,
          slug: l.slug,
          status: l.status,
          verificationStatus: l.verificationStatus,
          featured: l.featured,
          sponsored: l.sponsored,
          recommended: l.recommended,
          price: l.price?.toString() ?? null,
          startingPrice: l.startingPrice?.toString() ?? null,
          averageRating: Number(averageRating.toFixed(1)),
          ratingCount,
          unit: l.unit
            ? {
                id: l.unit.id,
                propertyType: l.unit.propertyType,
                bedrooms: l.unit.bedrooms,
                bathrooms: l.unit.bathrooms,
                buildingSize: l.unit.buildingSize,
                landSize: l.unit.landSize,
                availableUnits: l.unit.availableUnits,
              }
            : null,
          specs: l.specs,
          project: {
            id: l.project.id,
            name: l.project.name,
            slug: l.project.slug,
            status: l.project.status,
            smartReadiness: l.project.smartReadiness,
            startingPrice: l.project.startingPrice?.toString() ?? null,
            developer: {
              id: l.project.developer.id,
              name: l.project.developer.name,
              slug: l.project.developer.slug,
            },
            location: l.project.location
              ? {
                  city: l.project.location.city,
                  area: l.project.location.area,
                  province: l.project.location.province,
                }
              : null,
          },
          images: l.images.map((img) => ({
            id: img.id,
            url: img.mediaAsset.url,
            kind: img.mediaAsset.kind,
          })),
          smartFeatures: l.smartFeatures.map((sf) => ({
            id: sf.smartFeature.id,
            name: sf.smartFeature.name,
            slug: sf.smartFeature.slug,
            category: sf.smartFeature.category,
          })),
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        };
      }),
    };
  }

  async getPublicBySlug(slug: string) {
    const listing = await this.prisma.propertyListing.findFirst({
      where: {
        slug,
        status: ListingStatus.published,
        verificationStatus: VerificationStatus.approved,
        project: {
          verificationStatus: VerificationStatus.approved,
          developer: { verificationStatus: VerificationStatus.approved },
        },
      },
      include: {
        unit: true,
        project: {
          include: {
            developer: true,
            location: true,
          },
        },
        images: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: "asc" },
        },
        smartFeatures: {
          include: { smartFeature: true },
        },
        ratings: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!listing) return null;

    const ratingCount = listing.ratings.length;
    const averageRating =
      ratingCount > 0 ? listing.ratings.reduce((acc, r) => acc + r.rating, 0) / ratingCount : 0;

    return {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      description: listing.description,
      price: listing.price?.toString() ?? null,
      startingPrice: listing.startingPrice?.toString() ?? null,
      featured: listing.featured,
      sponsored: listing.sponsored,
      recommended: listing.recommended,
      status: listing.status,
      verificationStatus: listing.verificationStatus,
      averageRating: Number(averageRating.toFixed(1)),
      ratingCount,
      ratings: listing.ratings.map((r) => ({
        id: r.id,
        rating: r.rating,
        name: r.isAnonymous ? "Anonymous" : r.name || "Anonymous",
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      project: {
        id: listing.project.id,
        name: listing.project.name,
        slug: listing.project.slug,
        status: listing.project.status,
        smartReadiness: listing.project.smartReadiness,
        verificationStatus: listing.project.verificationStatus,
        startingPrice: listing.project.startingPrice?.toString() ?? null,
        location: listing.project.location
          ? {
              address: listing.project.location.address,
              city: listing.project.location.city,
              area: listing.project.location.area,
              province: listing.project.location.province,
              postalCode: listing.project.location.postalCode,
              latitude: listing.project.location.latitude,
              longitude: listing.project.location.longitude,
            }
          : null,
        developer: {
          id: listing.project.developer.id,
          name: listing.project.developer.name,
          slug: listing.project.developer.slug,
          verificationStatus: listing.project.developer.verificationStatus,
        },
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
            availableUnits: listing.unit.availableUnits,
          }
        : null,
      images: listing.images.map((img) => ({
        id: img.id,
        url: img.mediaAsset.url,
        kind: img.mediaAsset.kind,
        sortOrder: img.sortOrder,
      })),
      smartFeatures: listing.smartFeatures.map((sf) => ({
        id: sf.smartFeature.id,
        name: sf.smartFeature.name,
        slug: sf.smartFeature.slug,
        category: sf.smartFeature.category,
      })),
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  async submitRating(
    listingId: string,
    input: { rating: number; name?: string; comment?: string; isAnonymous?: boolean },
  ) {
    return this.prisma.propertyRating.create({
      data: {
        listingId,
        rating: input.rating,
        name: input.name?.trim() || null,
        comment: input.comment?.trim() || null,
        isAnonymous: input.isAnonymous ?? false,
      },
    });
  }
}
