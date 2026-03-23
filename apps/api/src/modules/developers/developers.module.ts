import { Module } from "@nestjs/common";

import { DeveloperProfileController } from "./developer-profile.controller";
import { DevelopersService } from "./developers.service";
import { PublicDevelopersController } from "./public-developers.controller";

@Module({
  controllers: [PublicDevelopersController, DeveloperProfileController],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule {}
