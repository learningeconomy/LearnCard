
/// <reference types="./shims/icss-utils" />
/// <reference types="./shims/less" />
/// <reference types="./shims/postcss-modules" />
/// <reference types="./shims/sass" />
/// <reference types="./shims/stylus" />
import * as rollup from 'rollup';
import { Plugin } from 'rollup';
import * as postcss from 'postcss';
import cssnano from 'cssnano';
import { RawSourceMap } from 'source-map-js';

/** File resolved by `@import` resolver */
interface ImportFile {
    /** Absolute path to file */
    from: string;
    /** File source */
    source: Uint8Array;
}
/** `@import` resolver */
declare type ImportResolve = (url: string, basedir: string, extensions: string[]) => Promise<ImportFile>;

/** `@import` handler options */
interface ImportOptions {
    /**
     * Provide custom resolver for imports
     * in place of the default one
     */
    resolve?: ImportResolve;
    /**
     * Aliases for import paths.
     * Overrides the global `alias` option.
     * - ex.: `{"foo":"bar"}`
     */
    alias?: Record<string, string>;
    /**
     * Import files ending with these extensions.
     * Overrides the global `extensions` option.
     * @default [".css", ".pcss", ".postcss", ".sss"]
     */
    extensions?: string[];
}

/** File resolved by URL resolver */
interface UrlFile {
    /** Absolute path to file */
    from: string;
    /** File source */
    source: Uint8Array;
    /** Original query extracted from the input path */
    urlQuery?: string;
}
/** URL resolver */
declare type UrlResolve = (inputUrl: string, basedir: string) => Promise<UrlFile>;

/** URL handler options */
interface UrlOptions {
    /**
     * Inline files instead of copying
     * @default true for `inject` mode, otherwise false
     */
    inline?: boolean;
    /**
     * Public Path for URLs in CSS files
     * @default "./"
     */
    publicPath?: string;
    /**
     * Directory path for outputted CSS assets,
     * which is not included into resulting URL
     * @default "."
     */
    assetDir?: string;
    /**
     * Enable/disable name generation with hash for outputted CSS assets
     * or provide your own placeholder with the following blocks:
     * - `[extname]`: The file extension of the asset including a leading dot, e.g. `.png`.
     * - `[ext]`: The file extension without a leading dot, e.g. `png`.
     * - `[hash(:<num>)]`: A hash based on the name and content of the asset (with optional length).
     * - `[name]`: The file name of the asset excluding any extension.
     *
     * Forward slashes / can be used to place files in sub-directories.
     * @default "assets/[name]-[hash][extname]" ("assets/[name][extname]" if false)
     */
    hash?: boolean | string;
    /**
     * Provide custom resolver for URLs
     * in place of the default one
     */
    resolve?: UrlResolve;
    /**
     * Aliases for URL paths.
     * Overrides the global `alias` option.
     * - ex.: `{"foo":"bar"}`
     */
    alias?: Record<string, string>;
}

/** Options for [CSS Modules](https://github.com/css-modules/css-modules) */
interface ModulesOptions {
    /**
     * Default mode for classes
     * @default "local"
     */
    mode?: "local" | "global" | "pure";
    /** Fail on wrong order of composition */
    failOnWrongOrder?: boolean;
    /** Export global classes */
    exportGlobals?: boolean;
    /**
     * Placeholder or function for scoped name generation.
     * Allowed blocks for placeholder:
     * - `[dir]`: The directory name of the asset.
     * - `[name]`: The file name of the asset excluding any extension.
     * - `[local]`: The original value of the selector.
     * - `[hash(:<num>)]`: A hash based on the name and content of the asset (with optional length).
     * @default "[name]_[local]__[hash:8]"
     */
    generateScopedName?: string | ((name: string, file: string, css: string) => string);
}

/**
 * Loader
 * @param T type of loader's options
 */
interface Loader<T = Record<string, unknown>> {
    /** Name */
    name: string;
    /**
     * Test to control if file should be processed.
     * Also used for plugin's supported files test.
     */
    test?: RegExp | ((file: string) => boolean);
    /** Skip testing, always process the file */
    alwaysProcess?: boolean;
    /** Function for processing */
    process: (this: LoaderContext<T>, payload: Payload) => Promise<Payload> | Payload;
}
/**
 * Loader's context
 * @param T type of loader's options
 */
interface LoaderContext<T = Record<string, unknown>> {
    /**
     * Loader's options
     * @default {}
     */
    readonly options: T;
    /** @see {@link Options.sourceMap} */
    readonly sourceMap: false | ({
        inline: boolean;
    } & SourceMapOptions);
    /** Resource path */
    readonly id: string;
    /** Files to watch */
    readonly deps: Set<string>;
    /** Assets to emit */
    readonly assets: Map<string, Uint8Array>;
    /** [Plugin's context](https://rollupjs.org/guide/en#plugin-context) */
    readonly plugin: rollup.PluginContext;
    /** [Function for emitting a warning](https://rollupjs.org/guide/en/#thiswarnwarning-string--rollupwarning-position-number---column-number-line-number---void) */
    readonly warn: rollup.PluginContext["warn"];
}
/** Extracted data */
interface Extracted {
    /** Source file path */
    id: string;
    /** CSS */
    css: string;
    /** Sourcemap */
    map?: string;
}
/** Loader's payload */
interface Payload {
    /** File content */
    code: string;
    /** Sourcemap */
    map?: string;
    /** Extracted data */
    extracted?: Extracted;
}
/** Options for sourcemaps */
interface SourceMapOptions {
    /**
     * Include sources content
     * @default true
     */
    content?: boolean;
    /** Function for transforming resulting sourcemap */
    transform?: (map: RawSourceMap, name?: string) => void;
}

/** Options for Sass loader */
interface SASSLoaderOptions extends Record<string, unknown>, sass.PublicOptions {
    /** Force Sass implementation */
    impl?: string;
    /** Forcefully enable/disable sync mode */
    sync?: boolean;
}

/** Options for Less loader */
interface LESSLoaderOptions extends Record<string, unknown>, less.PublicOptions {
}

/** Options for Stylus loader */
interface StylusLoaderOptions extends Record<string, unknown>, stylus.PublicOptions {
}

/** Options for PostCSS config loader */
interface PostCSSConfigLoaderOptions {
    /** Path to PostCSS config file directory */
    path?: string;
    /**
     * Context object passed to PostCSS config file
     * @default {}
     */
    ctx?: Record<string, unknown>;
}
/** CSS data for extraction */
interface ExtractedData {
    /** CSS */
    css: string;
    /** Sourcemap */
    map?: string;
    /** Output name for CSS */
    name: string;
}
/** Options for CSS injection */
interface InjectOptions {
    /**
     * Insert `<style>` tag(s) to the beginning of the container
     * @default false
     */
    prepend?: boolean;
    /**
     * Inject CSS into single `<style>` tag only
     * @default false
     */
    singleTag?: boolean;
    /**
     * Container for `<style>` tag(s) injection
     * @default "head"
     */
    container?: string;
    /**
     * Set attributes of injected `<style>` tag(s)
     * - ex.: `{"id":"global"}`
     */
    attributes?: Record<string, string>;
    /**
     * Makes injector treeshakeable,
     * as it is only called when either classes are referenced directly,
     * or `inject` function is called from the default export.
     *
     * Incompatible with `namedExports` option.
     */
    treeshakeable?: boolean;
}
/** `rollup-plugin-styles`'s full option list */
interface Options {
    /** Files to include for processing */
    include?: ReadonlyArray<string | RegExp> | string | RegExp | null;
    /** Files to exclude from processing */
    exclude?: ReadonlyArray<string | RegExp> | string | RegExp | null;
    /**
     * PostCSS will process files ending with these extensions
     * @default [".css", ".pcss", ".postcss", ".sss"]
     */
    extensions?: string[];
    /**
     * A list of plugins for PostCSS,
     * which are used before plugins loaded from PostCSS config file, if any
     */
    plugins?: Record<string, unknown> | (postcss.AcceptedPlugin | string | [string | postcss.PluginCreator<unknown>] | [string | postcss.PluginCreator<unknown>, Record<string, unknown>] | null | undefined)[];
    /**
     * Select mode for this plugin:
     * - `"inject"` *(default)* - Embeds CSS inside JS and injects it into `<head>` at runtime.
     * You can also pass options for CSS injection.
     * Alternatively, you can pass your own CSS injector.
     * - `"extract"` - Extract CSS to the same location where JS file is generated but with `.css` extension.
     * You can also set extraction path manually,
     * relative to output dir/output file's basedir,
     * but not outside of it.
     * - `"emit"` - Emit pure processed CSS and pass it along the build pipeline.
     * Useful if you want to preprocess CSS before using it with CSS consuming plugins.
     * @default "inject"
     */
    mode?: "inject" | ["inject"] | ["inject", InjectOptions | ((varname: string, id: string) => string)] | "extract" | ["extract"] | ["extract", string] | "emit" | ["emit"];
    /** `to` option for PostCSS, required for some plugins */
    to?: string;
    /**
     * Generate TypeScript declarations files for input style files
     * @default false
     */
    dts?: boolean;
    /**
     * Enable/disable or pass options for CSS `@import` resolver
     * @default true
     */
    import?: ImportOptions | boolean;
    /**
     * Enable/disable or pass options for CSS URL resolver
     * @default true
     */
    url?: UrlOptions | boolean;
    /**
     * Aliases for URL and import paths
     * - ex.: `{"foo":"bar"}`
     */
    alias?: Record<string, string>;
    /**
     * Enable/disable or pass options for
     * [CSS Modules](https://github.com/css-modules/css-modules)
     * @default false
     */
    modules?: boolean | ModulesOptions;
    /**
     * Automatically enable
     * [CSS Modules](https://github.com/css-modules/css-modules)
     * for files named `[name].module.[ext]`
     * (e.g. `foo.module.css`, `bar.module.stylus`),
     * or pass your own function or regular expression
     * @default false
     */
    autoModules?: boolean | RegExp | ((id: string) => boolean);
    /**
     * Use named exports alongside default export.
     * You can pass a function to control how exported name is generated.
     * @default false
     */
    namedExports?: boolean | ((name: string) => string);
    /**
     * Enable/disable or pass options for
     * [cssnano](https://github.com/cssnano/cssnano)
     * @default false
     */
    minimize?: boolean | cssnano.CssNanoOptions;
    /**
     * Enable/disable or configure sourcemaps
     * @default false
     */
    sourceMap?: boolean | "inline" | [boolean | "inline"] | [boolean | "inline", SourceMapOptions];
    /**
     * Set PostCSS parser, e.g. `sugarss`.
     * Overrides the one loaded from PostCSS config file, if any.
     */
    parser?: string | postcss.Parser;
    /**
     * Set PostCSS stringifier.
     * Overrides the one loaded from PostCSS config file, if any.
     */
    stringifier?: string | postcss.Stringifier;
    /**
     * Set PostCSS syntax.
     * Overrides the one loaded from PostCSS config file, if any.
     */
    syntax?: string | postcss.Syntax;
    /**
     * Enable/disable or pass options for PostCSS config loader
     * @default true
     */
    config?: boolean | PostCSSConfigLoaderOptions;
    /**
     * Array of loaders to use, executed from right to left.
     * Currently built-in loaders are:
     * - `sass` (Supports `.scss` and `.sass` files)
     * - `less` (Supports `.less` files)
     * - `stylus` (Supports `.styl` and `.stylus` files)
     * @default ["sass", "less", "stylus"]
     */
    use?: string[];
    /** Options for Sass loader */
    sass?: SASSLoaderOptions;
    /** Options for Less loader */
    less?: LESSLoaderOptions;
    /** Options for Stylus loader */
    stylus?: StylusLoaderOptions;
    /** Array of custom loaders */
    loaders?: Loader[];
    /**
     * Function which is invoked on CSS file import,
     * before any transformations are applied
     */
    onImport?: (code: string, id: string) => void;
    /**
     * Function which is invoked on CSS file extraction.
     * Return `boolean` to control if file should be extracted or not.
     */
    onExtract?: (data: ExtractedData) => boolean;
}

declare const _default: (options?: Options) => Plugin;

export { _default as default };
