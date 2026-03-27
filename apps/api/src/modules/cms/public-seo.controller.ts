import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CmsService } from "./cms.service";

@ApiTags("public")
@Controller("public/seo")
export class PublicSeoController {
  constructor(private readonly cms: CmsService) {}

  @Get()
  async getSettings() {
    return this.cms.getSeoSettings();
  }
}
