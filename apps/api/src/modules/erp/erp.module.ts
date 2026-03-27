import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PrismaModule } from "../prisma/prisma.module";

import { ErpController } from "./erp.controller";
import { ErpService } from "./erp.service";
import { LicenseCheckerMiddleware } from "./middleware/license-checker.middleware";
import { TenantResolverMiddleware } from "./middleware/tenant-resolver.middleware";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "livinova-secret-key",
    }),
  ],
  providers: [ErpService],
  controllers: [ErpController],
  exports: [ErpService],
})
export class ErpModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply multi-tenant and license middlewares to specific ERP routes
    consumer
      .apply(TenantResolverMiddleware, LicenseCheckerMiddleware)
      .forRoutes(
        { path: "api/erp/partner/*path", method: RequestMethod.ALL },
        { path: "api/erp/tenant/*path", method: RequestMethod.ALL },
        { path: "api/erp/projects", method: RequestMethod.ALL },
        { path: "api/erp/customers", method: RequestMethod.ALL },
        { path: "api/erp/sales", method: RequestMethod.ALL },
        { path: "api/erp/accounts", method: RequestMethod.ALL },
      );
  }
}
