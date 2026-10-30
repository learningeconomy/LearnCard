import type {
    ConsentFlowContractDetails,
    ConsentFlowContractDiff,
    ConsentFlowContractScope,
    ConsentFlowTerms,
    ConsentFlowContractUpdatePreview,
} from '@learncard/types';
import { getPersonalEntry } from '../../helpers/consentPersonalFields';
import type { CurrentUser } from 'learn-card-base/stores/currentUserStore';
export const getContractUpdateScopeKey = (scope: ConsentFlowContractScope) =>
    `${scope.area}|${scope.type}|${scope.key}`;

export const isContractUpdateScopeEnabled = (
    terms: ConsentFlowTerms,
    scope: ConsentFlowContractScope
) => {
    if (scope.type === 'personal') {
        return scope.area === 'read'
            ? terms.read.personal[scope.key] !== undefined
            : Boolean(terms.write.personal[scope.key]);
    }
    if (scope.area === 'write') return Boolean(terms.write.credentials.categories[scope.key]);
    const credentials = terms.read.credentials;
    if (credentials.sharing === false) return false;
    const category = credentials.categories[scope.key];
    return Boolean(
        credentials.shareAll ||
        (category?.sharing !== false && (category?.shareAll || category?.shared?.length))
    );
};

export const getEnabledOptionalUpdateScopeKeys = (
    terms: ConsentFlowTerms,
    rows: ConsentFlowContractUpdatePreview['rows']
): string[] => {
    const enabled: string[] = [];
    for (const row of rows) {
        if (row.change !== 'added' || row.scope.required) continue;
        if (
            row.scope.area === 'read' &&
            row.scope.type === 'credential' &&
            !terms.read.credentials.categories[row.scope.key]
        )
            continue;
        if (isContractUpdateScopeEnabled(terms, row.scope)) {
            enabled.push(getContractUpdateScopeKey(row.scope));
        }
    }
    return enabled;
};
/** Seeds review controls, not grants; access changes only when the holder saves. */
export const getDefaultEnabledOptionalUpdateScopeKeys = (
    contract: ConsentFlowContractDetails['contract'],
    rows: ConsentFlowContractUpdatePreview['rows']
): string[] => {
    const enabled: string[] = [];
    for (const row of rows) {
        if (row.change !== 'added' || row.scope.required) continue;
        const scope = row.scope;
        const config =
            scope.type === 'credential'
                ? contract[scope.area].credentials.categories[scope.key]
                : contract[scope.area].personal[scope.key];
        if (config?.defaultEnabled) enabled.push(getContractUpdateScopeKey(scope));
    }
    return enabled;
};

export const applyContractUpdateScopeChoice = (
    terms: ConsentFlowTerms,
    scope: ConsentFlowContractScope,
    enabled: boolean,
    user?: CurrentUser | null
) => {
    if (!enabled) {
        if (scope.type === 'personal') {
            if (scope.area === 'read') delete terms.read.personal[scope.key];
            else delete terms.write.personal[scope.key];
        } else if (scope.area === 'read') {
            delete terms.read.credentials.categories[scope.key];
        } else {
            delete terms.write.credentials.categories[scope.key];
        }
        return;
    }
    if (isContractUpdateScopeEnabled(terms, scope)) return;

    if (scope.type === 'personal') {
        if (scope.area === 'read') {
            terms.read.personal[scope.key] = getPersonalEntry(
                scope.key,
                user,
                terms.read.anonymize
            );
        } else {
            terms.write.personal[scope.key] = true;
        }
    } else if (scope.area === 'read') {
        terms.read.credentials.categories[scope.key] = {
            shareAll: true,
            sharing: true,
            shared: [],
        };
    } else {
        terms.write.credentials.categories[scope.key] = true;
    }
};
export const applyContractUpdateScopeChoices = (
    terms: ConsentFlowTerms,
    rows: ConsentFlowContractUpdatePreview['rows'],
    enabledOptionalKeys: string[],
    requestedReadCategoryKeys: readonly string[],
    user?: CurrentUser | null
): string[] => {
    const credentials = terms.read.credentials;
    const materialize = new Set<string>();
    const hasReadChange = rows.some(
        row =>
            row.change !== 'removed' && row.scope.area === 'read' && row.scope.type === 'credential'
    );
    if (hasReadChange && (credentials.shareAll || credentials.sharing === false)) {
        const added = new Set(
            rows
                .filter(
                    row =>
                        row.change === 'added' &&
                        row.scope.area === 'read' &&
                        row.scope.type === 'credential'
                )
                .map(row => row.scope.key)
        );
        const wasSharing = credentials.sharing !== false;
        for (const key of requestedReadCategoryKeys) {
            if (added.has(key)) continue;
            const existing = credentials.categories[key];
            credentials.categories[key] = {
                ...existing,
                sharing: wasSharing && (credentials.shareAll || existing?.sharing === true),
                ...(credentials.shareAll ? { shareAll: wasSharing } : {}),
                shared: existing?.shared ?? [],
            };
            if (credentials.shareAll && wasSharing) materialize.add(key);
        }
        // Root-wide grants covered only the previously accepted request, not new optional items.
        credentials.shareAll = false;
        credentials.sharing = true;
    }
    for (const row of rows) {
        if (row.change === 'removed') {
            applyContractUpdateScopeChoice(terms, row.scope, false, user);
            continue;
        }
        if (row.change === 'changed' && !row.scope.required) continue;
        applyContractUpdateScopeChoice(
            terms,
            row.scope,
            row.scope.required ||
                enabledOptionalKeys.includes(getContractUpdateScopeKey(row.scope)),
            user
        );
    }
    for (const row of rows) {
        if (
            row.change === 'removed' ||
            row.scope.area !== 'read' ||
            row.scope.type !== 'credential'
        )
            continue;
        const category = credentials.categories[row.scope.key];
        if (category?.sharing && category.shareAll) materialize.add(row.scope.key);
    }
    return [...materialize].filter(key => credentials.categories[key]?.sharing);
};
export const getUnchangedAccessScopes = (
    contract: ConsentFlowContractDetails,
    diff: ConsentFlowContractDiff,
    terms?: ConsentFlowTerms
): ConsentFlowContractScope[] => {
    const changed = new Set(
        [...diff.added, ...diff.removed, ...diff.changed].map(
            scope => `${scope.area}|${scope.type}|${scope.key}`
        )
    );
    const unchanged: ConsentFlowContractScope[] = [];
    if (terms) {
        for (const area of ['read', 'write'] as const) {
            const areaContract = contract.contract[area];
            for (const key of Object.keys(areaContract.credentials?.categories ?? {})) {
                const scope = { area, type: 'credential' as const, key, required: false };
                if (
                    !changed.has(`${area}|credential|${key}`) &&
                    isContractUpdateScopeEnabled(terms, scope)
                )
                    unchanged.push(scope);
            }
            for (const key of Object.keys(areaContract.personal ?? {})) {
                const scope = { area, type: 'personal' as const, key, required: false };
                if (
                    !changed.has(`${area}|personal|${key}`) &&
                    isContractUpdateScopeEnabled(terms, scope)
                )
                    unchanged.push(scope);
            }
        }
    }

    return unchanged;
};

/** Returns baseline access implied by a contract's initial-consent defaults, not user grants. */
export const getUnchangedDefaultAccessScopes = (
    contract: ConsentFlowContractDetails,
    diff: ConsentFlowContractDiff
): ConsentFlowContractScope[] => {
    const changed = new Set(
        [...diff.added, ...diff.removed, ...diff.changed].map(getContractUpdateScopeKey)
    );
    const defaults: ConsentFlowContractScope[] = [];
    for (const area of ['read', 'write'] as const) {
        const areaContract = contract.contract[area];
        for (const [key, config] of Object.entries(areaContract.credentials?.categories ?? {})) {
            const scope = { area, type: 'credential' as const, key, required: config.required };
            if (
                (config.required || config.defaultEnabled) &&
                !changed.has(getContractUpdateScopeKey(scope))
            ) {
                defaults.push(scope);
            }
        }
        for (const [key, config] of Object.entries(areaContract.personal ?? {})) {
            const scope = { area, type: 'personal' as const, key, required: config.required };
            if (
                (config.required || config.defaultEnabled) &&
                !changed.has(getContractUpdateScopeKey(scope))
            ) {
                defaults.push(scope);
            }
        }
    }
    return defaults;
};
