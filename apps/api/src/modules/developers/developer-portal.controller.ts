import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";

import { JwtUser } from "../auth/types";

import {
  brochureStorage,
  DeveloperPortalService,
  listingImageStorage,
} from "./developer-portal.service";
import { DeveloperOnly } from "./developer.guard";

@ApiTags("developer")
@Controller("developer")
export class DeveloperPortalController {
  constructor(private readonly portal: DeveloperPortalService) {}

  @Get("projects")
  @DeveloperOnly()
  async listProjects(@Req() req: { user: JwtUser }) {
    const items = await this.portal.listMyProjects(req.user.sub);
    return { items };
  }

  @Post("projects")
  @DeveloperOnly()
  async createProject(
    @Req() req: { user: JwtUser },
    @Body()
    body: {
      developerId?: string;
      name?: string;
      description?: string;
      status?: string;
      smartReadiness?: string;
      startingPrice?: number;
      location?: { address?: string; city?: string; area?: string; province?: string };
    },
  ) {
    return this.portal.createProject(req.user.sub, body);
  }

  @Put("projects/:id")
  @DeveloperOnly()
  async updateProject(
    @Req() req: { user: JwtUser },
    @Param("id") projectId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      status?: string;
      smartReadiness?: string;
      startingPrice?: number | null;
      location?: {
        address?: string | null;
        city?: string | null;
        area?: string | null;
        province?: string | null;
      };
    },
  ) {
    return this.portal.updateProject(req.user.sub, projectId, body);
  }

  @Get("listings")
  @DeveloperOnly()
  async listListings(@Req() req: { user: JwtUser }, @Query("projectId") projectId?: string) {
    const items = await this.portal.listMyListings(req.user.sub, { projectId });
    return { items };
  }

  @Post("listings")
  @DeveloperOnly()
  async createListing(
    @Req() req: { user: JwtUser },
    @Body()
    body: {
      projectId?: string;
      title?: string;
      description?: string;
      price?: number;
      startingPrice?: number;
    },
  ) {
    return this.portal.createListing(req.user.sub, body);
  }

  @Get("listings/:id")
  @DeveloperOnly()
  async getListing(@Req() req: { user: JwtUser }, @Param("id") listingId: string) {
    return this.portal.getListing(req.user.sub, listingId);
  }

  @Put("listings/:id")
  @DeveloperOnly()
  async updateListing(
    @Req() req: { user: JwtUser },
    @Param("id") listingId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      price?: number | null;
      startingPrice?: number | null;
    },
  ) {
    return this.portal.updateListing(req.user.sub, listingId, body);
  }

  @Put("listings/:id/unit")
  @DeveloperOnly()
  async upsertListingUnit(
    @Req() req: { user: JwtUser },
    @Param("id") listingId: string,
    @Body()
    body: {
      title?: string;
      propertyType?: "rumah" | "apartemen" | "ruko" | "villa" | "tanah";
      bedrooms?: number | null;
      bathrooms?: number | null;
      buildingSize?: number | null;
      landSize?: number | null;
      price?: number | null;
      startingPrice?: number | null;
      availableUnits?: number | null;
    },
  ) {
    return this.portal.upsertListingUnit(req.user.sub, listingId, body);
  }

  @Post("listings/:id/brochure")
  @DeveloperOnly()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { storage: brochureStorage }))
  async uploadBrochure(
    @Req() req: { user: JwtUser },
    @Param("id") listingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.portal.uploadBrochure(req.user.sub, listingId, file);
  }

  @Post("listings/:id/submit")
  @DeveloperOnly()
  async submitListing(@Req() req: { user: JwtUser }, @Param("id") listingId: string) {
    return this.portal.submitListing(req.user.sub, listingId);
  }

  @Post("listings/:id/images")
  @DeveloperOnly()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { storage: listingImageStorage }))
  async uploadListingImage(
    @Req() req: { user: JwtUser },
    @Param("id") listingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.portal.addListingImage(req.user.sub, listingId, file);
  }

  @Delete("listings/:id/images/:imageId")
  @DeveloperOnly()
  async deleteListingImage(
    @Req() req: { user: JwtUser },
    @Param("id") listingId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.portal.deleteListingImage(req.user.sub, listingId, imageId);
  }
}
