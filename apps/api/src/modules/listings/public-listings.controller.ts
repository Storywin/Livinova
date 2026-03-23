import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { PublicListingsQueryDto } from "./dto/public-listings.query";
import { ListingsService } from "./listings.service";

@ApiTags("public")
@Controller("public/listings")
export class PublicListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  async search(@Query() query: PublicListingsQueryDto) {
    return this.listingsService.searchPublic(query);
  }

  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    const result = await this.listingsService.getPublicBySlug(slug);
    return result;
  }
}
