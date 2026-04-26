import type { StatusListPlugin, StatusListPluginConfig } from './types';
/**
 * Build the StatusList plugin.
 *
 * @example
 * const baseLc = await generateLearnCard();
 * const lc = await baseLc.addPlugin(getStatusListPlugin(baseLc));
 * const result = await lc.invoke.checkCredentialStatus(myCredential);
 *
 * @group Plugins
 */
export declare const getStatusListPlugin: (_learnCard: unknown, config?: StatusListPluginConfig) => StatusListPlugin;
//# sourceMappingURL=plugin.d.ts.map