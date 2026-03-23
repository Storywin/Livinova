import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class CreateMortgageBankDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isSharia?: boolean;
}

export class UpdateMortgageBankDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isSharia?: boolean;
}
