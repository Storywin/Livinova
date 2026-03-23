import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";

import { AdminOnly } from "./admin.guard";
import { AdminService } from "./admin.service";
import { CreateMortgageBankDto, UpdateMortgageBankDto } from "./dto/mortgage-bank.dto";
import { CreateMortgageProductDto, UpdateMortgageProductDto } from "./dto/mortgage-product.dto";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@ApiTags("admin")
@Controller("admin/mortgage")
export class AdminMortgageController {
  constructor(private readonly adminService: AdminService) {}

  @Get("banks")
  @AdminOnly()
  async listBanks() {
    return this.adminService.listMortgageBanks();
  }

  @Post("banks")
  @AdminOnly()
  async createBank(@Body() dto: CreateMortgageBankDto) {
    return this.adminService.createMortgageBank(dto);
  }

  @Patch("banks/:id")
  @AdminOnly()
  async updateBank(@Param("id") id: string, @Body() dto: UpdateMortgageBankDto) {
    return this.adminService.updateMortgageBank(id, dto);
  }

  @Delete("banks/:id")
  @AdminOnly()
  async deleteBank(@Param("id") id: string) {
    return this.adminService.deleteMortgageBank(id);
  }

  @Get("products")
  @AdminOnly()
  async listProducts(@Query() query: { bankId?: string }) {
    return this.adminService.listMortgageProducts(query.bankId);
  }

  @Post("products")
  @AdminOnly()
  async createProduct(@Body() dto: CreateMortgageProductDto) {
    return this.adminService.createMortgageProduct(dto);
  }

  @Patch("products/:id")
  @AdminOnly()
  async updateProduct(@Param("id") id: string, @Body() dto: UpdateMortgageProductDto) {
    const data: Prisma.MortgageProductUpdateInput = {};

    if (dto.name) {
      data.name = dto.name.trim();
      data.slug = slugify(dto.name);
    }

    if (dto.defaultInterestRate !== undefined) data.defaultInterestRate = dto.defaultInterestRate;
    if (dto.promoInterestRate !== undefined) data.promoInterestRate = dto.promoInterestRate;
    if (dto.fixedPeriodMonths !== undefined) data.fixedPeriodMonths = dto.fixedPeriodMonths;
    if (dto.floatingRateAssumption !== undefined)
      data.floatingRateAssumption = dto.floatingRateAssumption;
    if (dto.shariaMargin !== undefined) data.shariaMargin = dto.shariaMargin;
    if (dto.adminFee !== undefined) data.adminFee = dto.adminFee;
    if (dto.insuranceRate !== undefined) data.insuranceRate = dto.insuranceRate;
    if (dto.provisiRate !== undefined) data.provisiRate = dto.provisiRate;
    if (dto.notaryFeeEstimate !== undefined) data.notaryFeeEstimate = dto.notaryFeeEstimate;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.adminService.updateMortgageProduct(id, data);
  }

  @Delete("products/:id")
  @AdminOnly()
  async deleteProduct(@Param("id") id: string) {
    return this.adminService.deleteMortgageProduct(id);
  }
}
