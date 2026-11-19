/**
 * Draft 3 §6.1.1: `hcp:{category}:{action}`, derived from `access`, never wider.
 * Custom categories are URIs whose colons would make a scope ambiguous, so they
 * appear only in `access`, never here.
 */
import { isRegisteredCategory, orderCategories, type AccessDetail } from './schemas';

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
