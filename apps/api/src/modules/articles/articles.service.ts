import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(input: { page?: number; pageSize?: number; q?: string }) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? Math.min(input.pageSize, 24) : 9;
    const skip = (page - 1) * pageSize;
    const q = input.q?.trim();
    const where: Prisma.ArticleWhereInput = {
      status: "published",
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { excerpt: { contains: q, mode: "insensitive" } },
              { tags: { has: q.toLowerCase() } },
            ],
          }
        : {}),
    };
    const [totalItems, items] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          title: true,
          coverImageUrl: true,
          excerpt: true,
          publishedAt: true,
          authorName: true,
          tags: true,
          metaTitle: true,
          metaDescription: true,
        },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return { page, pageSize, totalItems, totalPages, items };
  }

  async getBySlug(slug: string) {
    return this.prisma.article.findFirst({
      where: { slug, status: "published" },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImageUrl: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        authorName: true,
        tags: true,
        metaTitle: true,
        metaDescription: true,
      },
    });
  }
}
