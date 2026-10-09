export type StageEnv = Record<string, string>;

export type StageMap = Record<string, StageEnv>;

export interface ApplyStageConfigOptions {
    base?: StageEnv;
    stages?: StageMap;
    stage?: string;
    /**
     * Product the deployment serves (`CONFIG_TENANT`). Services shared by several
     * products (LearnCard, ScoutPass) deploy the same stage names, so the stage alone
     * cannot pick a file. Defaults to the env var, then {@link DEFAULT_TENANT}.
     */
    tenant?: string;
    env?: Record<string, string | undefined>;
}

export const DEFAULT_TENANT = 'learncard';

export interface ApplyStageConfigResult {
    stageDefaults: Record<string, string>;
}

const isNonEmpty = (value: string | undefined): value is string =>
    typeof value === 'string' && value !== '';

const nonEmptyEntries = (layer: StageEnv): [string, string][] =>
    Object.entries(layer).filter(([, value]) => isNonEmpty(value));

/**
 * Stage-map key for a tenant: `<stage>` for the default tenant (`config.<stage>.json`),
 * `<tenant>.<stage>` otherwise (`config.<tenant>.<stage>.json`).
 */
export const stageKey = (stage: string, tenant: string = DEFAULT_TENANT): string =>
    tenant === DEFAULT_TENANT ? stage : `${tenant}.${stage}`;

const selectStageOverlay = (options: ApplyStageConfigOptions): StageEnv => {
    if (!options.stage) return {};
    const env = options.env ?? process.env;
    const tenant = options.tenant || env.CONFIG_TENANT || DEFAULT_TENANT;
    const overlay = options.stages?.[stageKey(options.stage, tenant)];
    // An unknown default-tenant stage keeps the self-hosting contract (config.json only).
    // A named tenant must never fall back to another product's or the base settings.
    if (!overlay && tenant !== DEFAULT_TENANT) {
        throw new Error(
            `No config registered for tenant "${tenant}" stage "${options.stage}" (config.${stageKey(
                options.stage,
                tenant
            )}.json)`
        );
    }
    return overlay ?? {};
};

export const resolveStageDefaults = (options: ApplyStageConfigOptions): Record<string, string> => {
    const base = Object.fromEntries(nonEmptyEntries(options.base ?? {}));
    const stageOverlay = selectStageOverlay(options);
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
