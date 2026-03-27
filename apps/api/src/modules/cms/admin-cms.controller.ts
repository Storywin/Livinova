import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ArticleStatus, PageStatus } from "@prisma/client";

import { SuperAdminOnly } from "../admin/admin.guard";

import { CmsService } from "./cms.service";

type ArticleBody = {
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
};

type PageBody = {
  title?: string;
  slug?: string;
  content?: string;
  status?: PageStatus;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
};

@ApiTags("admin")
@Controller("admin/cms")
export class AdminCmsController {
  constructor(private readonly cms: CmsService) {}

  @Get("articles")
  @SuperAdminOnly()
  async listArticles(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
    @Query("status") status?: ArticleStatus,
  ) {
    return this.cms.listAdminArticles({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
      status,
    });
  }

  @Post("articles")
  @SuperAdminOnly()
  async createArticle(@Body() body: ArticleBody) {
    return this.cms.createArticle(body);
  }

  @Get("articles/:id")
  @SuperAdminOnly()
  async getArticle(@Param("id") id: string) {
    return this.cms.getAdminArticle(id);
  }

  @Put("articles/:id")
  @SuperAdminOnly()
  async updateArticle(@Param("id") id: string, @Body() body: ArticleBody) {
    return this.cms.updateArticle(id, body);
  }

  @Delete("articles/:id")
  @SuperAdminOnly()
  async deleteArticle(@Param("id") id: string) {
    return this.cms.deleteArticle(id);
  }

  @Get("pages")
  @SuperAdminOnly()
  async listPages(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
    @Query("status") status?: PageStatus,
  ) {
    return this.cms.listAdminPages({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
      status,
    });
  }

  @Post("pages")
  @SuperAdminOnly()
  async createPage(@Body() body: PageBody) {
    return this.cms.createPage(body);
  }

  @Get("pages/:id")
  @SuperAdminOnly()
  async getPage(@Param("id") id: string) {
    return this.cms.getAdminPage(id);
  }

  @Put("pages/:id")
  @SuperAdminOnly()
  async updatePage(@Param("id") id: string, @Body() body: PageBody) {
    return this.cms.updatePage(id, body);
  }

  @Delete("pages/:id")
  @SuperAdminOnly()
  async deletePage(@Param("id") id: string) {
    return this.cms.deletePage(id);
  }
}
