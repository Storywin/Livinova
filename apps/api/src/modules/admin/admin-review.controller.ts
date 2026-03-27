import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  ListingStatus,
  ProjectStatus,
  VerificationOutcome,
  VerificationStatus,
} from "@prisma/client";

import { JwtUser } from "../auth/types";

import { AdminOrVerifier } from "./admin.guard";
import { AdminService } from "./admin.service";
import { ReviewDevelopersQueryDto } from "./dto/review-developers.query";
import { ReviewListingsQueryDto } from "./dto/review-listings.query";
import { ReviewProjectsQueryDto } from "./dto/review-projects.query";
import { ReviewDto } from "./dto/review.dto";

@ApiTags("admin")
@Controller("admin/review")
export class AdminReviewController {
  constructor(private readonly adminService: AdminService) {}

  @Get("developers")
  @AdminOrVerifier()
  async listDevelopers(@Query() query: ReviewDevelopersQueryDto) {
    return this.adminService.listDevelopersForReview({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      status: query.status as VerificationStatus | undefined,
    });
  }

  @Post("developers/:id")
  @AdminOrVerifier()
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
  @AdminOrVerifier()
  async listListings(@Query() query: ReviewListingsQueryDto) {
    return this.adminService.listListingsForReview({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      status: query.status as ListingStatus | undefined,
      verificationStatus: query.verificationStatus as VerificationStatus | undefined,
    });
  }

  @Post("listings/:id")
  @AdminOrVerifier()
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

  @Get("projects")
  @AdminOrVerifier()
  async listProjects(@Query() query: ReviewProjectsQueryDto) {
    return this.adminService.listProjectsForReview({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      status: query.status as ProjectStatus | undefined,
      verificationStatus: query.verificationStatus as VerificationStatus | undefined,
    });
  }

  @Post("projects/:id")
  @AdminOrVerifier()
  async reviewProject(
    @Param("id") projectId: string,
    @Body() dto: ReviewDto,
    @Req() req: { user: JwtUser },
  ) {
    return this.adminService.reviewProject({
      projectId,
      reviewerId: req.user.sub,
      outcome: dto.outcome as VerificationOutcome,
      notes: dto.notes,
    });
  }
}
