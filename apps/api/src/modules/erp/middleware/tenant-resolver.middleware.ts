import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";

import { PrismaService } from "../../prisma/prisma.service";

type RequestWithContext = Request & {
  user?: { id: string; tenantId?: string | null };
  tenant?: { id: string; slug: string; partnerId?: string | null } | null;
};

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ctx = req as RequestWithContext;
    // 1. Try to get user from JWT first to see if they have a tenantId
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.decode(token);
        const decodedObject =
          decoded && typeof decoded === "object" ? (decoded as Record<string, unknown>) : null;
        const sub = decodedObject?.sub;
        const id = decodedObject?.id;
        const userId = typeof sub === "string" ? sub : typeof id === "string" ? id : null;
        if (userId) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
          });
          if (user) ctx.user = user;
        }
      } catch {
        // ignore invalid token decode
      }
    }

    // 2. Resolve tenant from X-Tenant-Slug header or user's tenantId
    let tenantSlug = req.headers["x-tenant-slug"] as string;

    // FOR DEMO: If no slug, and user is logged in, use their tenantId
    if (!tenantSlug && ctx.user?.tenantId) {
      const userTenant = await this.prisma.tenant.findUnique({
        where: { id: ctx.user.tenantId },
      });
      tenantSlug = userTenant?.slug || "";
    }

    if (!tenantSlug) {
      return next(); // Not an ERP request or tenant not specified
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { partner: { include: { subscriptions: true } } },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${tenantSlug}" not found`);
    }

    // Check partner subscription status
    const activeSubscription = tenant.partner?.subscriptions.find(
      (s) => s.status === "active" && s.endDate > new Date(),
    );

    if (!activeSubscription && tenant.partnerId !== "livinova-owner") {
      throw new UnauthorizedException("Partner subscription has expired. Please contact support.");
    }

    // Attach tenant to request
    ctx.tenant = tenant;
    next();
  }
}
