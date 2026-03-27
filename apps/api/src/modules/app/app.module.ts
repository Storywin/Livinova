import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";

import { AdminModule } from "../admin/admin.module";
import { ArticlesModule } from "../articles/articles.module";
import { AuthModule } from "../auth/auth.module";
import { CmsModule } from "../cms/cms.module";
import { DevelopersModule } from "../developers/developers.module";
import { ErpModule } from "../erp/erp.module";
import { ListingsModule } from "../listings/listings.module";
import { MortgageModule } from "../mortgage/mortgage.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RolesModule } from "../roles/roles.module";
import { SiteSettingsModule } from "../site-settings/site-settings.module";
import { UsersModule } from "../users/users.module";

import { validateEnv } from "./env";
import { LoggingInterceptor } from "./logging.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    RolesModule,
    UsersModule,
    AuthModule,
    ListingsModule,
    DevelopersModule,
    MortgageModule,
    SiteSettingsModule,
    ArticlesModule,
    CmsModule,
    AdminModule,
    ErpModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
