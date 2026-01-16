import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './auth/auth-exception.filter';

async function bootstrap() {
  console.log('[Bootstrap] Starting up...');
  const app = await NestFactory.create(AppModule);
  console.log('[Bootstrap] App created');

  // Apply global exception filter for better auth error messages
  app.useGlobalFilters(new AuthExceptionFilter());
  console.log('[Bootstrap] Global filters applied');

  const port = process.env.PORT ?? 3000;
  const host = '0.0.0.0';

  console.log(`[Bootstrap] Attempting to listen on ${host}:${port}...`);
  await app.listen(port, host);
  console.log(
    `[Bootstrap] Application successfully listening on ${host}:${port}`,
  );
}
void bootstrap();
