import { OnResolveResult, Plugin } from 'esbuild';
import { Opts as ResolveOpts } from 'resolve';
declare type ResolveAsyncOpts = ResolveOpts & {
    mainFields?: string[];
};
export declare const resolveAsync: (id: string, opts: ResolveAsyncOpts) => Promise<string | void>;
interface Options {
    name?: string;
    mainFields?: string[];
    extensions: string[];
    resolveSynchronously?: boolean;
    isExtensionRequiredInImportPath?: boolean;
    namespace?: string | undefined;
    onNonResolved?: (id: string, importer: string, e: Error) => OnResolveResult | undefined | null | void;
    onResolved?: (p: string, importer: string) => Promise<string | undefined | void | OnResolveResult> | any;
    resolveOptions?: Partial<ResolveOpts>;
}
export declare function NodeResolvePlugin({ onNonResolved, namespace, extensions, onResolved, resolveOptions, mainFields, name, isExtensionRequiredInImportPath, resolveSynchronously, }: Options): Plugin;
export default NodeResolvePlugin;
export declare const queryRE: RegExp;
export declare const cleanUrl: (url: string) => string;
//# sourceMappingURL=index.d.ts.map