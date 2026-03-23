import { IsIn, IsOptional } from "class-validator";

import { PaginationQueryDto } from "./pagination.query";

export class ReviewDevelopersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(["draft", "pending", "approved", "rejected", "revision_requested"])
  status?: "draft" | "pending" | "approved" | "rejected" | "revision_requested";
}
