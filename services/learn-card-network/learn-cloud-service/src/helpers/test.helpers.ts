import { environment } from '@environment';
export const isTest = environment.NODE_ENV === 'test';
