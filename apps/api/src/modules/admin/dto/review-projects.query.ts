import { IsIn, IsOptional } from "class-validator";

import { PaginationQueryDto } from "./pagination.query";

export class ReviewProjectsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(["ready_stock", "pre_launch", "under_development", "archived"])
  status?: "ready_stock" | "pre_launch" | "under_development" | "archived";

  @IsOptional()
  @IsIn(["draft", "pending", "approved", "rejected", "revision_requested"])
  verificationStatus?: "draft" | "pending" | "approved" | "rejected" | "revision_requested";
}
