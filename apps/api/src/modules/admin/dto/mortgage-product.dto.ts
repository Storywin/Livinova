import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateMortgageProductDto {
  @IsString()
  bankId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultInterestRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  promoInterestRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fixedPeriodMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floatingRateAssumption?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shariaMargin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adminFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insuranceRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  provisiRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  notaryFeeEstimate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMortgageProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultInterestRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  promoInterestRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fixedPeriodMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floatingRateAssumption?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shariaMargin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adminFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insuranceRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  provisiRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  notaryFeeEstimate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
