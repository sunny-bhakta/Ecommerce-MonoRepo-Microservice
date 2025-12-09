import { Type } from '@nestjs/common';
interface HttpBootstrapOptions {
    serviceName: string;
    defaultPort: number;
    enableMicroservice?: boolean;
}
export declare function bootstrapHttpService(AppModule: Type<unknown>, options: HttpBootstrapOptions): Promise<void>;
export declare function bootstrapWorker(AppModule: Type<unknown>, serviceName: string): Promise<void>;
export {};
