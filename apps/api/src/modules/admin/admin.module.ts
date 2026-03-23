import { Module } from "@nestjs/common";

import { AdminMortgageController } from "./admin-mortgage.controller";
import { AdminReviewController } from "./admin-review.controller";
import { AdminService } from "./admin.service";

@Module({
  controllers: [AdminMortgageController, AdminReviewController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
