import { IsIn, IsOptional } from "class-validator";

import { PaginationQueryDto } from "./pagination.query";

export class ReviewListingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(["draft", "pending", "approved", "rejected", "published", "archived"])
  status?: "draft" | "pending" | "approved" | "rejected" | "published" | "archived";

  @IsOptional()
  @IsIn(["draft", "pending", "approved", "rejected", "revision_requested"])
  verificationStatus?: "draft" | "pending" | "approved" | "rejected" | "revision_requested";
}
