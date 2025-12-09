"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapHttpService = bootstrapHttpService;
exports.bootstrapWorker = bootstrapWorker;
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
async function bootstrapHttpService(AppModule, options) {
    var _a, _b, _c;
    const app = await core_1.NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
    const configService = app.get(config_1.ConfigService);
    if ((_a = options.enableMicroservice) !== null && _a !== void 0 ? _a : true) {
        await app.startAllMicroservices();
    }
    const port = (_c = (_b = configService.get(`${options.serviceName.toUpperCase()}_PORT`)) !== null && _b !== void 0 ? _b : configService.get('PORT')) !== null && _c !== void 0 ? _c : options.defaultPort;
    await app.listen(port);
    app.enableShutdownHooks();
    console.log(`${options.serviceName} service listening on port ${port}`);
}
async function bootstrapWorker(AppModule, serviceName) {
    const app = await core_1.NestFactory.createMicroservice(AppModule, createRmqOptions(serviceName));
    await app.listen();
    console.log(`${serviceName} worker microservice is running`);
}
function connectRmqMicroservice(app, configService, serviceName) {
    app.connectMicroservice(createRmqOptions(serviceName, configService.get('RABBITMQ_URL'), (key) => configService.get(key)));
}
function createRmqOptions(serviceName, overrideUrl, envResolver) {
    var _a, _b, _c, _d;
    const envKey = `${serviceName.toUpperCase()}_QUEUE`;
    const rmqUrl = (_b = (_a = overrideUrl !== null && overrideUrl !== void 0 ? overrideUrl : envResolver === null || envResolver === void 0 ? void 0 : envResolver('RABBITMQ_URL')) !== null && _a !== void 0 ? _a : process.env.RABBITMQ_URL) !== null && _b !== void 0 ? _b : 'amqp://localhost:5672';
    const queue = (_d = (_c = envResolver === null || envResolver === void 0 ? void 0 : envResolver(envKey)) !== null && _c !== void 0 ? _c : process.env[envKey]) !== null && _d !== void 0 ? _d : `${serviceName}_queue`;
    return {
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [rmqUrl],
            queue,
            queueOptions: {
                durable: true,
            },
        },
    };
}
//# sourceMappingURL=bootstrap.js.map