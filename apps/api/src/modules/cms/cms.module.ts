import { Module } from "@nestjs/common";

import { AdminCmsController } from "./admin-cms.controller";
import { AdminSeoController } from "./admin-seo.controller";
import { CmsService } from "./cms.service";
import { PublicPagesController } from "./public-pages.controller";
import { PublicSeoController } from "./public-seo.controller";

@Module({
  providers: [CmsService],
  controllers: [AdminCmsController, AdminSeoController, PublicPagesController, PublicSeoController],
})
export class CmsModule {}
