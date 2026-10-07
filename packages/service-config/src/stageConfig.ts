export type StageEnv = Record<string, string>;

export type StageMap = Record<string, StageEnv>;

export interface ApplyStageConfigOptions {
    base?: StageEnv;
    stages?: StageMap;
    stage?: string;
    env?: Record<string, string | undefined>;
}

export interface ApplyStageConfigResult {
    stageDefaults: Record<string, string>;
}

const isNonEmpty = (value: string | undefined): value is string =>
    typeof value === 'string' && value !== '';

const nonEmptyEntries = (layer: StageEnv): [string, string][] =>
    Object.entries(layer).filter(([, value]) => isNonEmpty(value));

export const resolveStageDefaults = (options: ApplyStageConfigOptions): Record<string, string> => {
    const base = Object.fromEntries(nonEmptyEntries(options.base ?? {}));
    const stageOverlay = (options.stage && options.stages?.[options.stage]) || {};
    // An empty value in any layer means "unset", not "override": it must never clear a
    // value a lower layer provided. Drop empties before merging so an empty stage key
    // leaves the base value intact instead of blanking it.
    return { ...base, ...Object.fromEntries(nonEmptyEntries(stageOverlay)) };
};

export const applyStageConfig = (options: ApplyStageConfigOptions): ApplyStageConfigResult => {
    const env = options.env ?? process.env;
    const stageDefaults = resolveStageDefaults(options);
    for (const [key, value] of Object.entries(stageDefaults)) {
        if (!isNonEmpty(env[key])) env[key] = value;
    }
    return { stageDefaults };
};
