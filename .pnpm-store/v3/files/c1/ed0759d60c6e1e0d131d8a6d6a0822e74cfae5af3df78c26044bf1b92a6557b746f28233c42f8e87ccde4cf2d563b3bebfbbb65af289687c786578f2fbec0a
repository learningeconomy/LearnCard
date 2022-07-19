import type { Plugin } from 'esbuild';
import { GlobbyOptions } from 'globby';
declare type MaybeArray<T> = T | T[];
export interface AssetPair {
    /**
     * from path is resolved based on `cwd`
     */
    from: MaybeArray<string>;
    /**
     * to path is resolved based on `outdir` or `outfile` in your ESBuild options by default
     */
    to: MaybeArray<string>;
    /**
     * use Keep-Structure mode for current assets pair
     *
     * Keep-Structure mode will used for current assets
     * when one of the root-level keepStructure or asset-level keepSructure
     * is true
     *
     * @default false
     */
    keepStructure?: boolean;
}
export interface Options {
    /**
     * assets pair to copy
     * @default []
     */
    assets: MaybeArray<AssetPair>;
    /**
     * execute copy in `ESBuild.onEnd` hook(recommended)
     *
     * set to true if you want to execute in onStart hook
     * @default false
     */
    copyOnStart: boolean;
    /**
     * enable verbose logging
     *
     * outputs from-path and to-path finally passed to `fs.copyFileSync` method
     * @default false
     */
    verbose: boolean;
    /**
     * options passed to `globby` when we 're globbing for files to copy
     * @default {}
     */
    globbyOptions: GlobbyOptions;
    /**
     * only execute copy operation once
     *
     * useful when you're using ESBuild.build watching mode
     * @default false
     */
    once: boolean;
    /**
     * use `Keep-Structure` mode for all assets pairs
     *
     * @default false
     */
    keepStructure: boolean;
    /**
     * base path used to resolve relative `assets.to` path
     * by default this plugin use `outdir` or `outfile` in your ESBuild options
     * you can specify "cwd" or process.cwd() to resolve from current working directory,
     * also, you can specify somewhere else to resolve from.
     * @default "out"
     */
    resolveFrom: 'cwd' | 'out' | string;
    /**
     * use dry run mode to see what's happening.
     *
     * remember to keep `verbose` open to see the output.
     *
     * @default false
     */
    dryRun?: boolean;
}
export declare const copy: (options?: Partial<Options>) => Plugin;
export {};
