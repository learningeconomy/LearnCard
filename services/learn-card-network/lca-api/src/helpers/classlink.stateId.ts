import type { ClassLinkClaims, ClassLinkTenantConfig } from 'types/classlink';

export interface StateStudentIdResolver {
    resolve(claims: ClassLinkClaims, tenantCfg: ClassLinkTenantConfig): Promise<string | null>;
}

// OneRoster resolver: deferred.
export const apiFieldsResolver: StateStudentIdResolver = {
    async resolve(claims, tenantCfg) {
        let fields = claims.api_fields;
        if (typeof fields === 'string') {
            try {
                fields = JSON.parse(fields);
            } catch {
                return null;
            }
        }
        if (!tenantCfg.stateStudentIdField) return null;
        if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return null;
        if (!Object.prototype.hasOwnProperty.call(fields, tenantCfg.stateStudentIdField))
            return null;
        const value = (fields as Record<string, unknown>)[tenantCfg.stateStudentIdField];
        return typeof value === 'string' ? value.trim() || null : null;
    },
};

/** Resolve the state ID from verified token claims, never from userinfo. */
export const resolveStateStudentId = (
    claims: ClassLinkClaims,
    tenantCfg: ClassLinkTenantConfig
): Promise<string | null> => apiFieldsResolver.resolve(claims, tenantCfg);
