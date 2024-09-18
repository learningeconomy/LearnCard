export type { Filter, UpdateFilter } from 'mongodb';

export type { AppRouter } from './app';
export type { Context } from '@routes';

export { appRouter as mainApp } from './app';
export { app as didApp } from './dids';
export { app as swaggerApp } from './openapi';

export type { MongoCustomDocumentType } from '@models';
