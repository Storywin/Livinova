import { Body, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { PublicListingsQueryDto } from "./dto/public-listings.query";
import { ListingsService } from "./listings.service";

type SubmitRatingDto = {
  rating: number;
  name?: string;
  comment?: string;
  isAnonymous?: boolean;
};

@ApiTags("listings")
@Controller("public/listings")
export class PublicListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  async search(@Query() query: PublicListingsQueryDto) {
    return this.listingsService.searchPublic(query);
  }

  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    const listing = await this.listingsService.getPublicBySlug(slug);
    if (!listing) throw new NotFoundException("Listing tidak ditemukan");
    return listing;
  }

  @Post(":id/ratings")
  async submitRating(@Param("id") id: string, @Body() body: SubmitRatingDto) {
    return this.listingsService.submitRating(id, body);
  }
}
