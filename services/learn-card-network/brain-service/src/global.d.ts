declare module 'ioredis-mock' {
    import ioredis = require('ioredis');

    export type Redis = ioredis.Redis;

    type RedisOptions = { data?: Record<string, unknown> } & ioredis.RedisOptions;

    interface Constructor {
        new (port: number, host: string, options: RedisOptions): ioredis.Redis;
        new (path: string, options: RedisOptions): ioredis.Redis;
        new (port: number, options: RedisOptions): ioredis.Redis;
        new (port: number, host: string): ioredis.Redis;
        new (options: RedisOptions): ioredis.Redis;
        new (port: number): ioredis.Redis;
        new (path: string): ioredis.Redis;
        new (): ioredis.Redis;
    }

    const redisMock: Constructor;
    export default redisMock;
}

declare module '*.wasm';
