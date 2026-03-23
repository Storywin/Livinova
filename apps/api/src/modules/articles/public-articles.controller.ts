import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ArticlesService } from "./articles.service";

@ApiTags("public")
@Controller("public/articles")
export class PublicArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  async list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
  ) {
    const p = Number(page || "1") || 1;
    const ps = Number(pageSize || "9") || 9;
    return this.articles.listPublic({ page: p, pageSize: ps, q });
  }

  @Get(":slug")
  async get(@Param("slug") slug: string) {
    return this.articles.getBySlug(slug);
  }
}
