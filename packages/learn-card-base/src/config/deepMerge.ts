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
 *
 * Used by:
 *   - prepare-native-config.ts (build-time merge of tenant overrides)
 *   - validate-tenant-configs.ts (CI validation)
 *   - loadJsonTheme.ts (theme extends inheritance)
 *   - resolveTenantConfig.ts (runtime partial merge)
 */
export const deepMerge = (
    base: Record<string, unknown>,
    overrides: Record<string, unknown>,
): Record<string, unknown> => {
    const result = { ...base };

    for (const key of Object.keys(overrides)) {
        const baseVal = base[key];
        const overrideVal = overrides[key];

        // Skip undefined and null — neither should erase a valid base value
        if (overrideVal === undefined || overrideVal === null) continue;

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
                overrideVal as Record<string, unknown>,
            );
        } else {
            result[key] = overrideVal;
        }
    }

    return result;
};
