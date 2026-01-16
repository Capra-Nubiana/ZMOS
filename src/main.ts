import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  console.log('[Bootstrap] Starting up...');
  const app = await NestFactory.create(AppModule);
  console.log('[Bootstrap] App created');

  // Apply global exception filter for detailed error logging
  app.useGlobalFilters(new AllExceptionsFilter());
  console.log('[Bootstrap] Global filters applied');

  const port = process.env.PORT ?? 3000;
  const host = '0.0.0.0';

  console.log(`[Bootstrap] Attempting to listen on ${host}:${port}...`);
  await app.listen(port, host);
  console.log(
    `[Bootstrap] Application successfully listening on ${host}:${port}`,
  );
}
bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal error:', err);
  process.exit(1);
});
