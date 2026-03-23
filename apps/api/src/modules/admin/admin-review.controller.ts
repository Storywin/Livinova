import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ListingStatus, VerificationOutcome, VerificationStatus } from "@prisma/client";

import { JwtUser } from "../auth/types";

import { AdminOnly } from "./admin.guard";
import { AdminService } from "./admin.service";
import { ReviewDevelopersQueryDto } from "./dto/review-developers.query";
import { ReviewListingsQueryDto } from "./dto/review-listings.query";
import { ReviewDto } from "./dto/review.dto";

@ApiTags("admin")
@Controller("admin/review")
export class AdminReviewController {
  constructor(private readonly adminService: AdminService) {}

  @Get("developers")
  @AdminOnly()
  async listDevelopers(@Query() query: ReviewDevelopersQueryDto) {
    return this.adminService.listDevelopersForReview({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      status: query.status as VerificationStatus | undefined,
    });
  }

  @Post("developers/:id")
  @AdminOnly()
  async reviewDeveloper(
    @Param("id") developerId: string,
    @Body() dto: ReviewDto,
    @Req() req: { user: JwtUser },
  ) {
    return this.adminService.reviewDeveloper({
      developerId,
      reviewerId: req.user.sub,
      outcome: dto.outcome as VerificationOutcome,
      notes: dto.notes,
    });
  }

  @Get("listings")
  @AdminOnly()
  async listListings(@Query() query: ReviewListingsQueryDto) {
    return this.adminService.listListingsForReview({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      status: query.status as ListingStatus | undefined,
      verificationStatus: query.verificationStatus as VerificationStatus | undefined,
    });
  }

  @Post("listings/:id")
  @AdminOnly()
  async reviewListing(
    @Param("id") listingId: string,
    @Body() dto: ReviewDto,
    @Req() req: { user: JwtUser },
  ) {
    return this.adminService.reviewListing({
      listingId,
      reviewerId: req.user.sub,
      outcome: dto.outcome as VerificationOutcome,
      notes: dto.notes,
    });
  }
}
