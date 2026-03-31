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
    consumer
      .apply(TenantResolverMiddleware, LicenseCheckerMiddleware)
      .forRoutes(
        { path: "api/erp", method: RequestMethod.ALL },
        { path: "api/erp/*path", method: RequestMethod.ALL },
      );
  }
}
