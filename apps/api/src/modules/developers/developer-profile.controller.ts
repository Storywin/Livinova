import { Body, Controller, Get, Put, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { JwtUser } from "../auth/types";

import { DeveloperOnly } from "./developer.guard";
import { DevelopersService } from "./developers.service";

@ApiTags("developer")
@Controller("developer")
export class DeveloperProfileController {
  constructor(private readonly developers: DevelopersService) {}

  @Get("me")
  @DeveloperOnly()
  async me(@Req() req: { user: JwtUser }) {
    const developers = await this.developers.listMy(req.user.sub);
    return { developers };
  }

  @Put("profile-template")
  @DeveloperOnly()
  async updateTemplate(
    @Req() req: { user: JwtUser },
    @Body() body: { developerId?: string; profileTemplate?: string },
  ) {
    if (!body.developerId || !body.profileTemplate) return null;
    return this.developers.updateMyProfileTemplate(req.user.sub, {
      developerId: body.developerId,
      profileTemplate: body.profileTemplate,
    });
  }
}
