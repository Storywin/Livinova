import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CmsService } from "./cms.service";

@ApiTags("public")
@Controller("public/pages")
export class PublicPagesController {
  constructor(private readonly cms: CmsService) {}

  @Get()
  async list() {
    const items = await this.cms.listPublicPages();
    return { items };
  }

  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.cms.getPublicPageBySlug(slug);
  }
}
