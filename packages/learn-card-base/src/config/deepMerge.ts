/**
 * Deep merge utility for tenant config objects.
 *
 * Recursively merges `overrides` into `base`. Objects are merged key-by-key;
 * arrays and primitives in `overrides` replace the corresponding value in `base`.
 *
 * Special handling:
 *   - `undefined` values in overrides are skipped (base value preserved).
 *   - `null` values in overrides are skipped (prevents accidentally erasing
 *     a valid default with an explicit `null` in a partial config).
 *   - `storage` is replaced instead of merged when its discriminant provider
 *     changes, preventing Filestack fields from leaking into S3 configs.
 *
 * Used by:
 *   - prepare-native-config.ts (build-time merge of tenant overrides)
 *   - validate-tenant-configs.ts (CI validation)
 *   - loadJsonTheme.ts (theme extends inheritance)
 *   - resolveTenantConfig.ts (runtime partial merge)
 */
const getProvider = (value: unknown): unknown =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>).provider
        : undefined;

const shouldReplaceDiscriminatedUnion = (
    key: string,
    baseVal: unknown,
    overrideVal: unknown
): boolean => {
    if (key !== 'storage') return false;

    const baseProvider = getProvider(baseVal);
    const overrideProvider = getProvider(overrideVal);

    return (
        typeof baseProvider === 'string' &&
        typeof overrideProvider === 'string' &&
        baseProvider !== overrideProvider
    );
};

export const deepMerge = (
    base: Record<string, unknown>,
    overrides: Record<string, unknown>
): Record<string, unknown> => {
    const result = { ...base };

    for (const key of Object.keys(overrides)) {
        const baseVal = base[key];
        const overrideVal = overrides[key];

        // Skip undefined and null — neither should erase a valid base value
        if (overrideVal === undefined || overrideVal === null) continue;

        if (shouldReplaceDiscriminatedUnion(key, baseVal, overrideVal)) {
            result[key] = overrideVal;
            continue;
        }
        if (
            baseVal &&
            overrideVal &&
            typeof baseVal === 'object' &&
            !Array.isArray(baseVal) &&
            typeof overrideVal === 'object' &&
            !Array.isArray(overrideVal)
        ) {
            result[key] = deepMerge(
                baseVal as Record<string, unknown>,
                overrideVal as Record<string, unknown>
            );
        } else {
            result[key] = overrideVal;
        }
    }

    return result;
};
