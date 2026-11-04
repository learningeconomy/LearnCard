import { createHash } from 'node:crypto';

import { environment } from '@environment';
import type { ClassLinkClaims, ClassLinkTenantConfig } from 'types/classlink';

const TEST_STAGES = ['dev', 'development', 'staging', 'test', 'local'];

/** Same rule as the software escrow enclave: unknown deployed stages count as production. */
export const isTestStage = (): boolean =>
    environment.LAMBDA_STAGE
        ? TEST_STAGES.includes(environment.LAMBDA_STAGE)
        : environment.NODE_ENV !== 'production';

/** Stable per student, obviously fake, and never a real state ID format. */
export const getTestStateStudentId = (claims: ClassLinkClaims): string => {
    const digest = createHash('sha256')
        .update(
            `classlink-test-state-id:${claims.classLink_tenant_id}:${claims.classLink_sourcedId}`
        )
        .digest();
    return `TEST${(digest.readUIntBE(0, 6) % 10 ** 10).toString().padStart(10, '0')}`;
};

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
export const resolveStateStudentId = async (
    claims: ClassLinkClaims,
    tenantCfg: ClassLinkTenantConfig
): Promise<string | null> => {
    const fromDistrict = await apiFieldsResolver.resolve(claims, tenantCfg);
    if (fromDistrict || !tenantCfg.testStateStudentIds) return fromDistrict;
    if (!isTestStage()) {
        console.error('classlink.test_state_ids.ignored', { tenantId: claims.classLink_tenant_id });
        return null;
    }
    console.info('classlink.test_state_ids.used', { tenantId: claims.classLink_tenant_id });
    return getTestStateStudentId(claims);
};
