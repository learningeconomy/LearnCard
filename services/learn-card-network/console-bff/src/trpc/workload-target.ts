import { z } from 'zod';
import {
    WorkloadPlanValidator,
    InstallTargetStatusEnum,
    type InstallTarget,
} from '@learncard/types';

// Mirrors brain listInstallTargets output: any install target plus catalog enrichment
// resolved from the persisted listingId (see brain listRegistrySubscriptions /
// services/learn-card-network/brain-service/src/types/install-target.ts
// CatalogAwareInstallTargetValidator + EnrichedInstallTargetFieldsValidator).
export type EcosystemInstallTarget = InstallTarget & {
    listingId?: string;
    displayName?: string;
    tagline?: string;
};

// Mirrors brain's workload deployment target fields (see
// services/learn-card-network/brain-service/src/types/install-target.ts
// WorkloadDeploymentValidator). Brain reuses the base InstallTarget `status` field to
// carry the workload's lifecycle value rather than a separate `lifecycle` field — see
// services/learn-card-network/brain-service/src/types/workload-lifecycle.ts
// WorkloadLifecycleValidator for the values it actually takes.
export const WorkloadDeploymentFieldsValidator = z.object({
    status: InstallTargetStatusEnum,
    failureCode: z.string().optional(),
    packageId: z.string().optional(),
    packageVersionId: z.string().optional(),
    profiles: z.array(z.string()).optional(),
    approvedSpec: z.string().optional(),
    componentHealth: z.string().optional(),
    endpointsObserved: z.string().optional(),
    retainedObligations: z.array(z.string()).optional(),
    checkedAt: z.string().optional(),
});
export type WorkloadDeploymentFields = z.infer<typeof WorkloadDeploymentFieldsValidator>;

// Mirrors brain's WorkloadObservationValidator `components`/`endpoints` shapes (see
// services/learn-card-network/brain-service/src/types/workload-lifecycle.ts). Brain
// persists these as two separate JSON strings (componentHealth, endpointsObserved) on
// the install target rather than the combined WorkloadObservation object.
const ComponentHealthValidator = z.array(
    z.object({
        id: z.string(),
        healthy: z.boolean(),
    })
);

const EndpointsObservedValidator = z.array(
    z.object({
        id: z.string(),
        url: z.string(),
        healthy: z.boolean(),
    })
);

// @learncard/types WorkloadPlanValidator.endpoints is a loosely-typed
// z.record(string, unknown) per entry; narrow to the identity fields the console needs.
const PlanEndpointIdentityValidator = z.object({
    id: z.string(),
    visibility: z.string(),
});

// `InstallTarget['targetType']` is a flat enum shared by every target kind, so
// `EcosystemInstallTarget` alone isn't discriminable from `WorkloadDeploymentTarget` by
// TS (both structurally permit `targetType: 'WORKLOAD_DEPLOYMENT'`). Narrow the non-
// workload half of toWorkloadDeploymentTarget's return union so callers can discriminate
// on `targetType` directly instead of re-deriving a cast.
export type NonWorkloadInstallTarget = Omit<EcosystemInstallTarget, 'targetType'> & {
    targetType: Exclude<InstallTarget['targetType'], 'WORKLOAD_DEPLOYMENT'>;
};

export type WorkloadDeploymentTarget = EcosystemInstallTarget & {
    targetType: 'WORKLOAD_DEPLOYMENT';
    workload: {
        lifecycle: string;
        failureCode?: string;
        packageId: string;
        packageVersion: string;
        profiles: string[];
        components: Array<{ id: string; healthy: boolean; imageDigestShort: string }>;
        endpoints: Array<{ id: string; url: string; healthy: boolean; visibility: string }>;
        retainedObligations: string[];
        supportBoundary: Record<string, string>;
        checkedAt?: string;
    };
};

const parseJson = (raw: string): unknown => {
    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return undefined;
    }
};

const unreadableWorkload = (
    target: EcosystemInstallTarget,
    lifecycle: string
): WorkloadDeploymentTarget => ({
    ...target,
    targetType: 'WORKLOAD_DEPLOYMENT',
    workload: {
        lifecycle,
        failureCode: 'SPEC_UNREADABLE',
        packageId: '',
        packageVersion: '',
        profiles: [],
        components: [],
        endpoints: [],
        retainedObligations: [],
        supportBoundary: {},
    },
});

/**
 * Normalizes a raw ecosystem install target into its typed workload-deployment
 * projection. Non-workload targets pass through unchanged. Any failure to read or
 * parse the workload's stored fields (malformed JSON, a shape that doesn't match
 * brain's validators) degrades to an unreadable-but-renderable workload rather than
 * throwing — a single bad record must not break the whole list.
 */
export const toWorkloadDeploymentTarget = (
    target: EcosystemInstallTarget
): NonWorkloadInstallTarget | WorkloadDeploymentTarget => {
    // `targetType` is destructured (rather than narrowed via `target.targetType`) so the
    // non-workload branch's return type checks against `NonWorkloadInstallTarget`: TS
    // narrows a local variable's literal union on equality checks, but doesn't carry
    // that narrowing into the containing object's property for assignability purposes.
    const { targetType, ...rest } = target;
    if (targetType !== 'WORKLOAD_DEPLOYMENT') return { ...rest, targetType };

    const fieldsResult = WorkloadDeploymentFieldsValidator.safeParse(target);
    if (!fieldsResult.success) return unreadableWorkload(target, target.status);

    const fields = fieldsResult.data;

    let packageId = fields.packageId ?? '';
    let packageVersion = fields.packageVersionId ?? '';
    let profiles: string[] = fields.profiles ?? [];
    let components: WorkloadDeploymentTarget['workload']['components'] = [];
    let endpoints: WorkloadDeploymentTarget['workload']['endpoints'] = [];
    let supportBoundary: Record<string, string> = {};

    if (fields.approvedSpec) {
        const planJson = parseJson(fields.approvedSpec);
        if (planJson === undefined) return unreadableWorkload(target, fields.status);

        const planResult = WorkloadPlanValidator.safeParse(planJson);
        if (!planResult.success) return unreadableWorkload(target, fields.status);
        const plan = planResult.data;

        packageId = plan.packageId;
        packageVersion = plan.packageVersionId;
        profiles = plan.profiles;
        supportBoundary = plan.supportBoundary;

        let health: z.infer<typeof ComponentHealthValidator> = [];
        if (fields.componentHealth) {
            const healthJson = parseJson(fields.componentHealth);
            if (healthJson === undefined) return unreadableWorkload(target, fields.status);

            const healthResult = ComponentHealthValidator.safeParse(healthJson);
            if (!healthResult.success) return unreadableWorkload(target, fields.status);
            health = healthResult.data;
        }

        components = plan.components.map(component => {
            const matchedHealth = health.find(h => h.id === component.id);
            const digestMatch = component.image.match(/@sha256:([a-f0-9]{7})/);
            return {
                id: component.id,
                healthy: matchedHealth ? matchedHealth.healthy : false,
                imageDigestShort: digestMatch
                    ? (digestMatch[1] ?? '')
                    : (component.image.split(':').pop()?.substring(0, 7) ?? ''),
            };
        });

        let observedEndpoints: z.infer<typeof EndpointsObservedValidator> = [];
        if (fields.endpointsObserved) {
            const endpointsJson = parseJson(fields.endpointsObserved);
            if (endpointsJson === undefined) return unreadableWorkload(target, fields.status);

            const endpointsResult = EndpointsObservedValidator.safeParse(endpointsJson);
            if (!endpointsResult.success) return unreadableWorkload(target, fields.status);
            observedEndpoints = endpointsResult.data;
        }

        const parsedEndpoints: WorkloadDeploymentTarget['workload']['endpoints'] = [];
        for (const rawEndpoint of plan.endpoints) {
            const identity = PlanEndpointIdentityValidator.safeParse(rawEndpoint);
            if (!identity.success) return unreadableWorkload(target, fields.status);

            const observed = observedEndpoints.find(e => e.id === identity.data.id);
            parsedEndpoints.push({
                id: identity.data.id,
                url: observed ? observed.url : '',
                healthy: observed ? observed.healthy : false,
                visibility: identity.data.visibility,
            });
        }
        endpoints = parsedEndpoints;
    }

    return {
        ...target,
        targetType: 'WORKLOAD_DEPLOYMENT',
        workload: {
            lifecycle: fields.status,
            failureCode: fields.failureCode,
            packageId,
            packageVersion,
            profiles,
            components,
            endpoints,
            retainedObligations: fields.retainedObligations ?? [],
            supportBoundary,
            checkedAt: fields.checkedAt,
        },
    };
};
