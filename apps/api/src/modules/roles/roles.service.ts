import { Injectable, OnModuleInit } from "@nestjs/common";
import { RoleName } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureBaselineRoles();
  }

  async ensureBaselineRoles() {
    const roleNames = Object.values(RoleName);

    await Promise.all(
      roleNames.map((name) =>
        this.prisma.role.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );
  }

  async list() {
    return this.prisma.role.findMany({ orderBy: { name: "asc" } });
  }
}
