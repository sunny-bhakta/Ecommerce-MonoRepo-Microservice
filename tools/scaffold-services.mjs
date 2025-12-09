import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const services = [
  { name: 'gateway', port: 3000 },
  { name: 'auth', port: 3010 },
  { name: 'user', port: 3020 },
  { name: 'vendor', port: 3030 },
  { name: 'catalog', port: 3040 },
  { name: 'inventory', port: 3050 },
  { name: 'order', port: 3060 },
  { name: 'payment', port: 3070 },
  { name: 'shipping', port: 3080 },
  { name: 'review', port: 3090 },
  { name: 'analytics', port: 3100 },
  { name: 'admin', port: 3110 },
  { name: 'search', port: 3120 },
];

const rootDir = process.cwd();

const camelToClass = (name) => name.charAt(0).toUpperCase() + name.slice(1);

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, contents);
}

for (const service of services) {
  const serviceDir = path.join(rootDir, 'apps', service.name, 'src');
  ensureDir(serviceDir);

  const className = camelToClass(service.name);

  const controllerContent = `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class ${className}Controller {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }
}
`;

  const serviceContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: '${service.name}',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
`;

  const moduleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ${className}Controller } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [${className}Controller],
  providers: [AppService],
})
export class AppModule {}
`;

  const mainContent = `import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: '${service.name}',
    defaultPort: ${service.port},
  });
}

bootstrap();
`;

  writeFile(path.join(serviceDir, 'app.controller.ts'), controllerContent);
  writeFile(path.join(serviceDir, 'app.service.ts'), serviceContent);
  writeFile(path.join(serviceDir, 'app.module.ts'), moduleContent);
  writeFile(path.join(serviceDir, 'main.ts'), mainContent);

  writeFile(
    path.join(rootDir, 'apps', service.name, 'tsconfig.app.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.json',
        compilerOptions: {
          outDir: '../../dist/out-tsc',
          rootDir: './src',
          module: 'commonjs',
          types: ['node'],
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist', 'test', '**/*.spec.ts'],
      },
      null,
      2,
    ),
  );
}

console.log(`Scaffolded ${services.length} Nest services.`);

