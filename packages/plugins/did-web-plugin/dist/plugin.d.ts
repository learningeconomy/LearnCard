import { LearnCard } from '@learncard/core';
import { DidWebPluginDependentMethods, DidWebPlugin } from './types';
export * from './types';
/**
 * @group Plugins
 */
export declare const getDidWebPlugin: (learnCard: LearnCard<any, 'id', DidWebPluginDependentMethods>, didWeb: string) => Promise<DidWebPlugin>;
