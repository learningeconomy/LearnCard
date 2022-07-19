/// <reference types="node" />
/**
 * Returns async promise with absolute file path of given command,
 * and resolves with undefined if the command not found.
 * @param {string} command Command name to look for.
 * @param {LookPathOption} opt Options for lookpath.
 * @return {Promise<string|undefined>} Resolves absolute file path, or undefined if not found.
 */
export declare function lookpath(command: string, opt?: LookPathOption): Promise<string | undefined>;
/**
 * Options for lookpath.
 */
export interface LookPathOption {
    /**
     * Additional pathes to look for, would be dealt same as PATH env.
     * Example: ['/tmp/bin', 'usr/local/bin']
     */
    include?: string[];
    /**
     * Pathes to exclude to look for.
     * Example: ['/mnt']
     */
    exclude?: string[];
    /**
     * Set of env var to be used ON BEHALF OF the existing env of your runtime.
     * If `include` or `exclude` are given, they will be applied to this env set.
     */
    env?: NodeJS.ProcessEnv;
}
