import { Global, Module, type OnApplicationShutdown, Inject } from '@nestjs/common';
import pg from 'pg';

export const POOL = Symbol('PostgresPool');

@Global()
@Module({
  providers: [
    {
      provide: POOL,
      useFactory: () =>
        new pg.Pool({
          connectionString:
            process.env.DATABASE_URL ?? 'postgres://tienda:tienda@localhost:5432/tienda',
        }),
    },
  ],
  exports: [POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
