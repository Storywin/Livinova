import { Module } from "@nestjs/common";

import { ArticlesService } from "./articles.service";
import { PublicArticlesController } from "./public-articles.controller";

@Module({
  providers: [ArticlesService],
  controllers: [PublicArticlesController],
})
export class ArticlesModule {}
