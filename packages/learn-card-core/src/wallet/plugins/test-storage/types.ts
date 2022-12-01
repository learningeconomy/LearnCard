import { Plugin } from 'types/wallet';

export type TestStoragePlugin = Plugin<'Test Storage', 'read' | 'store' | 'index'>;
