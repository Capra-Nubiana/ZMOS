import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './auth/auth-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global exception filter for better auth error messages
  app.useGlobalFilters(new AuthExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
