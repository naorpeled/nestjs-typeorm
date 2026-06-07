import { INestApplication, Provider } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as typeorm from 'typeorm';
import { DataSource } from 'typeorm';
import { TypeOrmCoreModule } from '../../lib/typeorm-core.module';
import { ApplicationModule } from '../src/app.module';

/**
 * The legacy `Connection` class was removed in TypeORM 1.0. The package keeps a
 * backward-compatibility alias provider (`{ provide: Connection, useExisting:
 * DataSource }`) so that, on TypeORM 0.3.x, `@InjectConnection()` and the
 * `Connection` token keep resolving to the active `DataSource`.
 *
 * These tests adapt to the installed TypeORM version:
 *  - on 0.3.x (Connection present) we assert the alias is wired up and resolves;
 *  - on 1.x (Connection removed) we assert the alias is *not* registered and that
 *    nothing crashes / no `undefined` token leaks into the providers.
 */
const Connection: unknown = (typeorm as any).Connection;
const hasConnection = Boolean(Connection);
const describePreV1 = hasConnection ? describe : describe.skip;

const findProvider = (
  providers: Provider[] | undefined,
  token: unknown,
): Provider | undefined =>
  (providers ?? []).find(
    (provider) =>
      typeof provider === 'object' &&
      provider !== null &&
      'provide' in provider &&
      (provider as { provide: unknown }).provide === token,
  );

describe('Connection backward-compatibility wiring', () => {
  const baseOptions = { type: 'postgres' } as any;

  describe('forRoot (default data source)', () => {
    const dynamicModule = TypeOrmCoreModule.forRoot(baseOptions);
    const aliasProvider = hasConnection
      ? findProvider(dynamicModule.providers, Connection)
      : undefined;

    if (hasConnection) {
      it('registers a Connection alias for the DataSource', () => {
        expect(aliasProvider).toBeDefined();
        expect((aliasProvider as any).useExisting).toBe(DataSource);
        expect(dynamicModule.exports).toContain(Connection);
      });
    } else {
      it('does not register a Connection alias on TypeORM v1', () => {
        // `Connection` is undefined on v1 — make sure no provider/export leaked.
        expect(findProvider(dynamicModule.providers, undefined)).toBeUndefined();
        expect(dynamicModule.exports).not.toContain(undefined);
      });
    }
  });

  describe('forRootAsync (default data source)', () => {
    const dynamicModule = TypeOrmCoreModule.forRootAsync({
      useFactory: () => baseOptions,
    });

    if (hasConnection) {
      it('registers a Connection alias for the DataSource', () => {
        const aliasProvider = findProvider(dynamicModule.providers, Connection);
        expect(aliasProvider).toBeDefined();
        expect((aliasProvider as any).useExisting).toBe(DataSource);
        expect(dynamicModule.exports).toContain(Connection);
      });
    } else {
      it('does not register a Connection alias on TypeORM v1', () => {
        expect(findProvider(dynamicModule.providers, undefined)).toBeUndefined();
        expect(dynamicModule.exports).not.toContain(undefined);
      });
    }
  });

  describe('forRoot (named data source)', () => {
    it('never aliases Connection for a named data source', () => {
      const dynamicModule = TypeOrmCoreModule.forRoot({
        name: 'connection_2',
        type: 'postgres',
      } as any);
      // The provider token is the string `connection_2DataSource`, not the
      // DataSource class, so the Connection alias branch is skipped regardless
      // of the installed TypeORM version.
      expect(hasConnection ? findProvider(dynamicModule.providers, Connection) : undefined).toBeUndefined();
    });
  });
});

describePreV1('Connection injection (pre-v1, live data source)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('resolves the legacy Connection token to the active DataSource', () => {
    const connection = app.get(Connection as any);
    const dataSource = app.get(DataSource);
    expect(connection).toBe(dataSource);
    expect(dataSource.isInitialized).toBe(true);
  });
});
