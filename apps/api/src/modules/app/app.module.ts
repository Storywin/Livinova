import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AdminModule } from "../admin/admin.module";
import { ArticlesModule } from "../articles/articles.module";
import { AuthModule } from "../auth/auth.module";
import { DevelopersModule } from "../developers/developers.module";
import { ListingsModule } from "../listings/listings.module";
import { MortgageModule } from "../mortgage/mortgage.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RolesModule } from "../roles/roles.module";
import { SiteSettingsModule } from "../site-settings/site-settings.module";
import { UsersModule } from "../users/users.module";

import { validateEnv } from "./env";

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
    AdminModule,
  ],
})
export class AppModule {}
