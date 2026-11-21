/**
 * Draft 3 §6.1.1: `hcp:{category}:{action}`, derived from `access`, never wider.
 * Custom categories are URIs whose colons would make a scope ambiguous, so they
 * appear only in `access`, never here.
 */
import {
    CONTEXT_ACCESS_DETAIL_TYPE,
    isRegisteredCategory,
    orderCategories,
    type AccessDetail,
    type GrantAction,
} from './schemas';

type Purpose = AccessDetail['purposes'][number];

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

export const scopesForAccess = (access: readonly AccessDetail[]): string[] =>
    unique(
        access.flatMap(detail =>
            detail.categories
                .filter(isRegisteredCategory)
                .flatMap(category => detail.actions.map(action => `hcp:${category}:${action}`))
        )
    ).sort();

export const parseScopeString = (scope: string | null | undefined): string[] =>
    (scope ?? '')
        .split(/\s+/)
        .map(s => s.trim())
        .filter(Boolean)
        .sort();

export const categoriesFromScopes = (scopes: readonly string[]): string[] =>
    orderCategories(
        unique(
            scopes
                .map(scope => {
                    const match = /^hcp:([a-z0-9_]+):(read|write)$/.exec(scope);
                    return match?.[1];
                })
                .filter((c): c is string => Boolean(c))
        )
    );

const SCOPE = /^hcp:([a-z0-9_]+):(read|write)$/;

/**
 * The inverse of scopesForAccess, for a grant issued from OAuth scopes: one access
 * detail per distinct action set, every detail under `purpose`. Null when a scope is
 * malformed or names a category that is not registered (scopes never carry custom
 * categories), so the caller refuses rather than grants something else.
 * `scopesForAccess(accessForScopes(s, p))` is `s`, sorted and deduplicated.
 */
export const accessForScopes = (
    scopes: readonly string[],
    purpose: Purpose
): AccessDetail[] | null => {
    if (scopes.length === 0) return null;
    const actionsByCategory = new Map<string, Set<GrantAction>>();
    for (const scope of scopes) {
        const match = SCOPE.exec(scope);
        if (!match || !isRegisteredCategory(match[1]!)) return null;
        const actions = actionsByCategory.get(match[1]!) ?? new Set<GrantAction>();
        actions.add(match[2] as GrantAction);
        actionsByCategory.set(match[1]!, actions);
    }

    const categoriesByActions = new Map<string, string[]>();
    for (const category of orderCategories(actionsByCategory.keys())) {
        const key = [...actionsByCategory.get(category)!].sort().join(' ');
        categoriesByActions.set(key, [...(categoriesByActions.get(key) ?? []), category]);
    }
    return [...categoriesByActions].map(([actions, categories]) => ({
        type: CONTEXT_ACCESS_DETAIL_TYPE,
        actions: actions.split(' ') as GrantAction[],
        categories,
        purposes: [purpose],
    }));
};
