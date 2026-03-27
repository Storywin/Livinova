import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ArticleStatus, PageStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSeoSettings() {
    return this.prisma.seoSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
  }

  async updateSeoSettings(input: {
    siteName?: string;
    titleTemplate?: string;
    defaultMetaDescription?: string | null;
    robotsTxt?: string | null;
    sitemapEnabled?: boolean;
    googleSiteVerification?: string | null;
  }) {
    const data: Prisma.SeoSettingsUpdateInput = {};
    if (typeof input.siteName === "string") data.siteName = input.siteName.trim().slice(0, 120);
    if (typeof input.titleTemplate === "string")
      data.titleTemplate = input.titleTemplate.trim().slice(0, 160);
    if (input.defaultMetaDescription !== undefined)
      data.defaultMetaDescription = input.defaultMetaDescription?.trim() || null;
    if (input.robotsTxt !== undefined) data.robotsTxt = input.robotsTxt?.trim() || null;
    if (typeof input.sitemapEnabled === "boolean") data.sitemapEnabled = input.sitemapEnabled;
    if (input.googleSiteVerification !== undefined)
      data.googleSiteVerification = input.googleSiteVerification?.trim() || null;

    return this.prisma.seoSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...(data as Prisma.SeoSettingsCreateInput) },
    });
  }

  async listAdminArticles(input: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: ArticleStatus;
  }) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? Math.min(input.pageSize, 50) : 20;
    const skip = (page - 1) * pageSize;
    const q = input.q?.trim();

    const where: Prisma.ArticleWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { excerpt: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { tags: { has: q.toLowerCase() } },
            ],
          }
        : {}),
    };

    const [totalItems, items] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImageUrl: true,
          authorName: true,
          tags: true,
          status: true,
          publishedAt: true,
          metaTitle: true,
          metaDescription: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return { page, pageSize, totalItems, totalPages, items };
  }

  async getAdminArticle(id: string) {
    const row = await this.prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        authorName: true,
        tags: true,
        content: true,
        status: true,
        publishedAt: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) throw new NotFoundException("Artikel tidak ditemukan");
    return row;
  }

  async createArticle(input: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    coverImageUrl?: string;
    authorName?: string;
    tags?: string[];
    status?: ArticleStatus;
    metaTitle?: string;
    metaDescription?: string;
    publishedAt?: string;
  }) {
    if (!input.title || !input.title.trim()) throw new BadRequestException("Judul artikel wajib");
    const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);
    if (!slug) throw new BadRequestException("Slug artikel tidak valid");

    const tags = Array.isArray(input.tags)
      ? input.tags
          .map((t) => String(t).trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 24)
      : [];

    const status = input.status ?? ArticleStatus.draft;
    const publishedAt = input.publishedAt
      ? new Date(input.publishedAt)
      : status === ArticleStatus.published
        ? new Date()
        : null;

    try {
      return await this.prisma.article.create({
        data: {
          title: input.title.trim(),
          slug,
          excerpt: input.excerpt?.trim() || null,
          content: input.content?.trim() || "",
          coverImageUrl: input.coverImageUrl?.trim() || null,
          authorName: input.authorName?.trim() || null,
          tags,
          status,
          publishedAt,
          metaTitle: input.metaTitle?.trim() || null,
          metaDescription: input.metaDescription?.trim() || null,
        },
      });
    } catch {
      throw new BadRequestException("Gagal membuat artikel (slug mungkin sudah dipakai)");
    }
  }

  async updateArticle(
    id: string,
    input: Partial<{
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      coverImageUrl: string | null;
      authorName: string | null;
      tags: string[];
      status: ArticleStatus;
      metaTitle: string | null;
      metaDescription: string | null;
      publishedAt: string | null;
    }>,
  ) {
    const current = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!current) throw new NotFoundException("Artikel tidak ditemukan");

    const data: Prisma.ArticleUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.slug !== undefined) data.slug = slugify(input.slug);
    if (input.excerpt !== undefined) data.excerpt = input.excerpt?.trim() || null;
    if (input.content !== undefined) data.content = input.content.trim();
    if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl?.trim() || null;
    if (input.authorName !== undefined) data.authorName = input.authorName?.trim() || null;
    if (input.tags !== undefined) {
      data.tags = input.tags
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 24);
    }
    if (input.metaTitle !== undefined) data.metaTitle = input.metaTitle?.trim() || null;
    if (input.metaDescription !== undefined)
      data.metaDescription = input.metaDescription?.trim() || null;
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === ArticleStatus.published && !current.publishedAt) {
        data.publishedAt = new Date();
      }
      if (input.status !== ArticleStatus.published) {
        data.publishedAt = null;
      }
    }
    if (input.publishedAt !== undefined) {
      data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    }

    try {
      return await this.prisma.article.update({ where: { id }, data });
    } catch {
      throw new BadRequestException("Gagal menyimpan artikel (slug mungkin sudah dipakai)");
    }
  }

  async deleteArticle(id: string) {
    await this.prisma.article.delete({ where: { id } });
    return { ok: true };
  }

  async listAdminPages(input: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: PageStatus;
  }) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? Math.min(input.pageSize, 50) : 20;
    const skip = (page - 1) * pageSize;
    const q = input.q?.trim();

    const where: Prisma.CmsPageWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [totalItems, items] = await Promise.all([
      this.prisma.cmsPage.count({ where }),
      this.prisma.cmsPage.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          metaTitle: true,
          metaDescription: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return { page, pageSize, totalItems, totalPages, items };
  }

  async getAdminPage(id: string) {
    const row = await this.prisma.cmsPage.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        status: true,
        metaTitle: true,
        metaDescription: true,
        canonicalUrl: true,
        ogImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) throw new NotFoundException("Halaman tidak ditemukan");
    return row;
  }

  async createPage(input: {
    title?: string;
    slug?: string;
    content?: string;
    status?: PageStatus;
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
  }) {
    if (!input.title || !input.title.trim()) throw new BadRequestException("Judul halaman wajib");
    const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);
    if (!slug) throw new BadRequestException("Slug halaman tidak valid");

    try {
      return await this.prisma.cmsPage.create({
        data: {
          title: input.title.trim(),
          slug,
          content: input.content?.trim() || null,
          status: input.status ?? PageStatus.draft,
          metaTitle: input.metaTitle?.trim() || null,
          metaDescription: input.metaDescription?.trim() || null,
          canonicalUrl: input.canonicalUrl?.trim() || null,
          ogImageUrl: input.ogImageUrl?.trim() || null,
        },
      });
    } catch {
      throw new BadRequestException("Gagal membuat halaman (slug mungkin sudah dipakai)");
    }
  }

  async updatePage(
    id: string,
    input: Partial<{
      title: string;
      slug: string;
      content: string | null;
      status: PageStatus;
      metaTitle: string | null;
      metaDescription: string | null;
      canonicalUrl: string | null;
      ogImageUrl: string | null;
    }>,
  ) {
    const current = await this.prisma.cmsPage.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new NotFoundException("Halaman tidak ditemukan");

    const data: Prisma.CmsPageUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.slug !== undefined) data.slug = slugify(input.slug);
    if (input.content !== undefined) data.content = input.content?.trim() || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.metaTitle !== undefined) data.metaTitle = input.metaTitle?.trim() || null;
    if (input.metaDescription !== undefined)
      data.metaDescription = input.metaDescription?.trim() || null;
    if (input.canonicalUrl !== undefined) data.canonicalUrl = input.canonicalUrl?.trim() || null;
    if (input.ogImageUrl !== undefined) data.ogImageUrl = input.ogImageUrl?.trim() || null;

    try {
      return await this.prisma.cmsPage.update({ where: { id }, data });
    } catch {
      throw new BadRequestException("Gagal menyimpan halaman (slug mungkin sudah dipakai)");
    }
  }

  async deletePage(id: string) {
    await this.prisma.cmsPage.delete({ where: { id } });
    return { ok: true };
  }

  async listPublicPages() {
    return this.prisma.cmsPage.findMany({
      where: { status: PageStatus.published },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        metaTitle: true,
        metaDescription: true,
        updatedAt: true,
      },
    });
  }

  async getPublicPageBySlug(slug: string) {
    const row = await this.prisma.cmsPage.findFirst({
      where: { slug, status: PageStatus.published },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        canonicalUrl: true,
        ogImageUrl: true,
        updatedAt: true,
      },
    });
    if (!row) throw new NotFoundException("Halaman tidak ditemukan");
    return row;
  }
}
