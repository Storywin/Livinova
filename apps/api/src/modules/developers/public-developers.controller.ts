import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { DevelopersService } from "./developers.service";
import { ApplyDeveloperDto } from "./dto/apply-developer.dto";

@ApiTags("public")
@Controller("public/developers")
export class PublicDevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  async list(
    @Query()
    query: {
      q?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.developersService.listPublic({
      q: query.q,
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 12,
    });
  }

  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.developersService.getPublicBySlug(slug);
  }

  @Post("apply")
  async apply(@Body() dto: ApplyDeveloperDto) {
    return this.developersService.applyPublic(dto);
  }
}
