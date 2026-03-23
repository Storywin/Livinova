import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { SiteSettingsService } from "./site-settings.service";

@ApiTags("public")
@Controller("public/site-settings")
export class PublicSiteSettingsController {
  constructor(private readonly siteSettings: SiteSettingsService) {}

  @Get()
  async get() {
    return this.siteSettings.getPublic();
  }
}
