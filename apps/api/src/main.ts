import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

import { AppModule } from "./modules/app/app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Livinova API")
    .setDescription("API untuk platform Livinova")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  try {
    await app.listen(port);
    logger.log(`Aplikasi API berjalan di port ${port}`);
  } catch (err: unknown) {
    const e = err as { code?: unknown; message?: unknown };
    if (e?.code === "EADDRINUSE") {
      logger.error(
        `Port ${port} sedang digunakan. Kemungkinan ada instance API lain yang masih berjalan. Hentikan proses yang memakai port tersebut atau ubah env PORT.`,
      );
      try {
        await app.close();
      } catch {}
      process.exit(0);
    }
    throw err;
  }
}

void bootstrap();
