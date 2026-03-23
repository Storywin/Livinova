import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewDto {
  @IsIn(["approved", "rejected", "revision_requested"])
  outcome!: "approved" | "rejected" | "revision_requested";

  @IsOptional()
  @IsString()
  notes?: string;
}
