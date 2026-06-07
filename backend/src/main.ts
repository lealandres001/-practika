import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación automática de DTOs en todos los endpoints.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // rechaza payloads con propiedades extra
      transform: true, // convierte tipos según el DTO
    }),
  );

  app.setGlobalPrefix('api');
  app.enableCors();

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`PRACTIKA API escuchando en http://localhost:${port}/api`);
}

bootstrap();
