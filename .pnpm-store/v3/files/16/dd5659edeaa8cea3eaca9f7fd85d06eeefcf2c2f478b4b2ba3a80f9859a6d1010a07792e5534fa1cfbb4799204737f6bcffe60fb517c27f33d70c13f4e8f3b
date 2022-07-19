import { Plugin } from 'rollup';
import { TransformOptions, BuildOptions, Loader } from 'esbuild';
import { FilterPattern } from '@rollup/pluginutils';

/** Mark some properties as optional, leaving others unchanged */
declare type MarkOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

declare type Options$1 = Omit<TransformOptions, 'sourcemap'> & {
    sourceMap?: boolean;
};
declare const minify: (options?: Options$1) => Plugin;

declare type OptimizeDepsOptions = {
    include: string[];
    exclude?: string[];
    cwd: string;
    esbuildOptions?: BuildOptions;
    sourceMap: boolean;
};

declare type Options = Omit<TransformOptions, 'sourcemap' | 'loader' | 'tsconfigRaw'> & {
    include?: FilterPattern;
    exclude?: FilterPattern;
    sourceMap?: boolean;
    optimizeDeps?: MarkOptional<OptimizeDepsOptions, 'cwd' | 'sourceMap'>;
    /**
     * Use this tsconfig file instead
     * Disable it by setting to `false`
     */
    tsconfig?: string | false;
    /**
     * Map extension to esbuild loader
     * Note that each entry (the extension) needs to start with a dot
     */
    loaders?: {
        [ext: string]: Loader | false;
    };
};
declare const _default: ({ include, exclude, sourceMap: _sourceMap, optimizeDeps, tsconfig, loaders: _loaders, ...esbuildOptions }?: Options) => Plugin;

export { Options, _default as default, minify };
