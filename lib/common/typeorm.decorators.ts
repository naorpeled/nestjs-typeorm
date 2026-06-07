import { Inject } from '@nestjs/common';
import { EntityClassOrSchema } from '../interfaces/entity-class-or-schema.type';
import { DEFAULT_DATA_SOURCE_NAME } from '../typeorm.constants';
import {
  DataSourceLike,
  getDataSourceToken,
  getEntityManagerToken,
  getRepositoryToken,
} from './typeorm.utils';

/**
 * @publicApi
 */
export const InjectRepository = (
  entity: EntityClassOrSchema,
  dataSource: string = DEFAULT_DATA_SOURCE_NAME,
): ReturnType<typeof Inject> => Inject(getRepositoryToken(entity, dataSource));

/**
 * @publicApi
 */
export const InjectDataSource: (
  dataSource?: DataSourceLike,
) => ReturnType<typeof Inject> = (dataSource?: DataSourceLike) =>
  Inject(getDataSourceToken(dataSource));

/** @deprecated */
export const InjectConnection = InjectDataSource;

/**
 * @publicApi
 */
export const InjectEntityManager: (
  dataSource?: DataSourceLike,
) => ReturnType<typeof Inject> = (dataSource?: DataSourceLike) =>
  Inject(getEntityManagerToken(dataSource));
