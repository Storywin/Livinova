import { Module } from "@nestjs/common";

import { DeveloperPortalController } from "./developer-portal.controller";
import { DeveloperPortalService } from "./developer-portal.service";
import { DeveloperProfileController } from "./developer-profile.controller";
import { DevelopersService } from "./developers.service";
import { PublicDevelopersController } from "./public-developers.controller";

@Module({
  controllers: [PublicDevelopersController, DeveloperProfileController, DeveloperPortalController],
  providers: [DevelopersService, DeveloperPortalService],
  exports: [DevelopersService],
})
export class DevelopersModule {}
