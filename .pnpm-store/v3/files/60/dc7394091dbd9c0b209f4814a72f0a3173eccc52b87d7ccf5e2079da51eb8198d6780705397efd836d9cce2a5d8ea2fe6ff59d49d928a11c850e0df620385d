export declare class PathCache {
    useCache: boolean;
    existsCache: Map<string, boolean>;
    absoluteCache: Map<{
        basePath: string;
        aliasPath: string;
    }, string>;
    constructor(useCache: boolean);
    private exists;
    existsResolvedAlias(path: string): boolean;
    private getAAP;
    getAbsoluteAliasPath(basePath: string, aliasPath: string): string;
}
