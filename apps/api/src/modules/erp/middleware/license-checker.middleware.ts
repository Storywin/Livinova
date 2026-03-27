import * as crypto from "crypto";

import { Injectable, NestMiddleware, ForbiddenException, Logger } from "@nestjs/common";
import type { License } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

import { PrismaService } from "../../prisma/prisma.service";

type RequestWithContext = Request & {
  user?: {
    id: string;
    email: string;
    roles: Array<{ role: { name: string } }>;
  };
  tenant?: { id: string };
  license?: License;
};

@Injectable()
export class LicenseCheckerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LicenseCheckerMiddleware.name);

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ctx = req as RequestWithContext;
    const { user, tenant } = ctx;

    if (!user || !tenant) {
      return next();
    }

    // Skip license check for non-ERP users (e.g. Super Admin, Partner)
    const userRoles = user.roles.map((r) => r.role.name);
    if (!userRoles.includes("erp_user")) {
      return next();
    }

    // Device binding logic
    const userAgent = req.headers["user-agent"] || "unknown";
    const ip = req.ip;
    const deviceHash = crypto
      .createHash("sha256")
      .update(`${userAgent}-${ip}-${user.id}`)
      .digest("hex");

    const license = await this.prisma.license.findFirst({
      where: {
        userId: user.id,
        tenantId: tenant.id,
        status: "active",
        endDate: { gt: new Date() },
      },
    });

    if (!license) {
      throw new ForbiddenException("No active license found for this user in this tenant.");
    }

    // Bind device on first login
    if (!license.deviceHash) {
      await this.prisma.license.update({
        where: { id: license.id },
        data: {
          deviceHash,
          deviceName: userAgent.substring(0, 100),
          lastLoginAt: new Date(),
        },
      });
      this.logger.log(`Device bound for user ${user.email} with hash ${deviceHash}`);
    } else if (license.deviceHash !== deviceHash) {
      // Log suspicious activity
      await this.prisma.deviceLog.create({
        data: {
          licenseId: license.id,
          deviceHash,
          ipAddress: ip,
          status: "failed",
        },
      });
      throw new ForbiddenException(
        "Mismatch device! This license is already bound to another device.",
      );
    }

    // Log successful login
    await this.prisma.deviceLog.create({
      data: {
        licenseId: license.id,
        deviceHash,
        ipAddress: ip,
        status: "success",
      },
    });

    ctx.license = license;
    next();
  }
}
