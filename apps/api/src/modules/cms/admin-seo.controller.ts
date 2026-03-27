import { Body, Controller, Get, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { SuperAdminOnly } from "../admin/admin.guard";

import { CmsService } from "./cms.service";

type SeoSettingsBody = {
  siteName?: string;
  titleTemplate?: string;
  defaultMetaDescription?: string | null;
  robotsTxt?: string | null;
  sitemapEnabled?: boolean;
  googleSiteVerification?: string | null;
};

@ApiTags("admin")
@Controller("admin/seo")
export class AdminSeoController {
  constructor(private readonly cms: CmsService) {}

  @Get()
  @SuperAdminOnly()
  async getSettings() {
    return this.cms.getSeoSettings();
  }

  @Put()
  @SuperAdminOnly()
  async updateSettings(@Body() body: SeoSettingsBody) {
    return this.cms.updateSeoSettings(body);
  }
}
