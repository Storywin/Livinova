import { Module } from "@nestjs/common";

import { MortgageService } from "./mortgage.service";
import { PublicMortgageController } from "./public-mortgage.controller";

@Module({
  controllers: [PublicMortgageController],
  providers: [MortgageService],
  exports: [MortgageService],
})
export class MortgageModule {}
