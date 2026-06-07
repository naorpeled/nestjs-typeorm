import { DataSource, EntityManager, EntitySchema, Repository } from 'typeorm';
import {
  getConnectionToken,
  getCustomRepositoryToken,
  getDataSourceName,
  getDataSourcePrefix,
  getDataSourceToken,
  getEntityManagerToken,
  getRepositoryToken,
  InjectConnection,
  InjectDataSource,
} from '../../lib';
import { Photo } from '../src/photo/photo.entity';

/**
 * Version-agnostic unit tests for the token/utility helpers.
 *
 * These run unchanged on both TypeORM 0.3.x and 1.x: they reference only APIs
 * that exist on both lines (DataSource, EntityManager, EntitySchema, Repository)
 * and exercise the backward-compatible token generation that the package relies
 * on regardless of the installed TypeORM version.
 */
describe('TypeOrm token utils', () => {
  describe('getDataSourceToken', () => {
    it('returns the DataSource class for the default data source', () => {
      expect(getDataSourceToken()).toBe(DataSource);
      expect(getDataSourceToken('default')).toBe(DataSource);
      expect(getDataSourceToken({} as any)).toBe(DataSource);
      expect(getDataSourceToken({ name: 'default' } as any)).toBe(DataSource);
    });

    it('returns a string token for a named data source', () => {
      expect(getDataSourceToken('connection_2')).toBe('connection_2DataSource');
      expect(getDataSourceToken({ name: 'connection_2' } as any)).toBe(
        'connection_2DataSource',
      );
    });
  });

  describe('getEntityManagerToken', () => {
    it('returns the EntityManager class for the default data source', () => {
      expect(getEntityManagerToken()).toBe(EntityManager);
      expect(getEntityManagerToken('default')).toBe(EntityManager);
      expect(getEntityManagerToken({ name: 'default' } as any)).toBe(
        EntityManager,
      );
    });

    it('returns a string token for a named data source', () => {
      expect(getEntityManagerToken('connection_2')).toBe(
        'connection_2EntityManager',
      );
      expect(getEntityManagerToken({ name: 'connection_2' } as any)).toBe(
        'connection_2EntityManager',
      );
    });
  });

  describe('getDataSourcePrefix', () => {
    it('returns an empty prefix for the default data source', () => {
      expect(getDataSourcePrefix()).toBe('');
      expect(getDataSourcePrefix('default')).toBe('');
      expect(getDataSourcePrefix({ name: 'default' } as any)).toBe('');
      expect(getDataSourcePrefix({} as any)).toBe('');
    });

    it('returns a "name_" prefix for a named data source', () => {
      expect(getDataSourcePrefix('connection_2')).toBe('connection_2_');
      expect(getDataSourcePrefix({ name: 'connection_2' } as any)).toBe(
        'connection_2_',
      );
    });
  });

  describe('getRepositoryToken', () => {
    it('builds a token from an entity class', () => {
      expect(getRepositoryToken(Photo)).toBe('PhotoRepository');
      expect(getRepositoryToken(Photo, 'connection_2')).toBe(
        'connection_2_PhotoRepository',
      );
    });

    it('builds a token from an EntitySchema (with target)', () => {
      const schema = new EntitySchema<Photo>({
        name: 'PhotoSchema',
        target: Photo,
        columns: { id: { type: Number, primary: true, generated: true } },
      });
      expect(getRepositoryToken(schema)).toBe('PhotoRepository');
      expect(getRepositoryToken(schema, 'connection_2')).toBe(
        'connection_2_PhotoRepository',
      );
    });

    it('builds a token from an EntitySchema (without target)', () => {
      const schema = new EntitySchema<Photo>({
        name: 'photo-without-target',
        columns: { id: { type: Number, primary: true, generated: true } },
      });
      expect(getRepositoryToken(schema)).toBe(
        'photo-without-targetRepository',
      );
    });

    it('returns the class itself for a custom repository on the default data source', () => {
      class CustomPhotoRepository extends Repository<Photo> {}
      expect(getRepositoryToken(CustomPhotoRepository)).toBe(
        CustomPhotoRepository,
      );
    });

    it('returns a prefixed token for a custom repository on a named data source', () => {
      class CustomPhotoRepository extends Repository<Photo> {}
      expect(getRepositoryToken(CustomPhotoRepository, 'connection_2')).toBe(
        'connection_2_CustomPhotoRepository',
      );
    });
  });

  describe('getCustomRepositoryToken', () => {
    it('returns the repository class name', () => {
      class CustomPhotoRepository extends Repository<Photo> {}
      expect(getCustomRepositoryToken(CustomPhotoRepository)).toBe(
        'CustomPhotoRepository',
      );
    });
  });

  describe('getDataSourceName', () => {
    it('accepts a plain { name } object and falls back to the default', () => {
      expect(getDataSourceName({ name: 'connection_2' })).toBe('connection_2');
      expect(getDataSourceName({})).toBe('default');
      expect(getDataSourceName(undefined as any)).toBe('default');
    });
  });

  describe('deprecated aliases (pre-v1 compatibility)', () => {
    it('keeps getConnectionToken as an alias of getDataSourceToken', () => {
      expect(getConnectionToken).toBe(getDataSourceToken);
    });

    it('keeps InjectConnection as an alias of InjectDataSource', () => {
      expect(InjectConnection).toBe(InjectDataSource);
    });
  });
});
