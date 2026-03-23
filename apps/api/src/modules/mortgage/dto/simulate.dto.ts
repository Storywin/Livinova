import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class MortgageSimulateDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  propertyPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downPayment!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenorMonths!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  additionalFees?: number;
}
