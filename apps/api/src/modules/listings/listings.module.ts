import { Module } from "@nestjs/common";

import { ListingsService } from "./listings.service";
import { PublicListingsController } from "./public-listings.controller";

@Module({
  controllers: [PublicListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
