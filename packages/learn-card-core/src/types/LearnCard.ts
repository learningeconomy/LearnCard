import type { LearnCard, Plugin } from 'types/wallet';

export type GetPlugins<LC extends LearnCard<any, any, any>> = LC['plugins'];

export type AddPlugin<LC extends LearnCard<any, any, any>, P extends Plugin> = LearnCard<
    [...GetPlugins<LC>, P]
>;
