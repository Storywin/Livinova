import { Body, Controller, Get, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { AdminOnly, SuperAdminOnly } from "../admin/admin.guard";

import { SiteSettingsService } from "./site-settings.service";

@ApiTags("admin")
@Controller("admin/site-settings")
export class AdminSiteSettingsController {
  constructor(private readonly siteSettings: SiteSettingsService) {}

  @Get()
  @AdminOnly()
  async get() {
    return this.siteSettings.getPublic();
  }

  @Put()
  @SuperAdminOnly()
  async update(@Body() body: { socialLinks?: unknown }) {
    return this.siteSettings.updateSocialLinks(body?.socialLinks);
  }
}
