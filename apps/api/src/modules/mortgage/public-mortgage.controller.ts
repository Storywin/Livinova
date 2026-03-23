import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { MortgageSimulateDto } from "./dto/simulate.dto";
import { MortgageService } from "./mortgage.service";

@ApiTags("public")
@Controller("public/mortgage")
export class PublicMortgageController {
  constructor(private readonly mortgageService: MortgageService) {}

  @Get("banks")
  async banks() {
    return this.mortgageService.listPublicBanks();
  }

  @Get("products")
  async products(@Query() query: { bankSlug?: string }) {
    return this.mortgageService.listPublicProducts({ bankSlug: query.bankSlug });
  }

  @Post("simulate")
  async simulate(@Body() dto: MortgageSimulateDto) {
    return this.mortgageService.simulatePublic(dto);
  }
}
