import { TRPCError } from '@trpc/server';
import { validateWorkloadConfig } from '@learncard/types';
import type { BundleWorkloadMember, WorkloadPackage, WorkloadPlan } from '@learncard/types';
import { environment } from '@environment';
import { readWorkloadPackageVersion } from '@accesslayer/workload-package/read';
import {
    assertSignedWorkloadPackageOrThrow,
    computeWorkloadManifestHash,
} from './manifest-signature.helpers';
import { assertWorkloadCurator } from './workload-package.helpers';
import { assertNoInlineWorkloadSecrets } from './workload-config.helpers';

const badRequest: (message: string) => never = (message): never => {
    throw new TRPCError({ code: 'BAD_REQUEST', message });
};

export const resolveWorkloadPlan = async (
    member: BundleWorkloadMember,
    config: Record<string, unknown>,
    bundle: WorkloadPlan['bundle']
): Promise<WorkloadPlan> => {
    if (!environment.WORKLOAD_LOCAL_COMPOSE_ENABLED) {
        badRequest('Workload planning is blocked: WORKLOAD_LOCAL_COMPOSE_ENABLED is false.');
    }
    const version = await readWorkloadPackageVersion(member.packageVersionId);
    if (!version || version.status !== 'PUBLISHED')
        badRequest('Workload package version must be PUBLISHED.');
    const manifest = await assertSignedWorkloadPackageOrThrow(version.manifestJson, {
        manifestHash: version.manifestHash,
    });
    const hash = computeWorkloadManifestHash(JSON.parse(version.manifestJson) as WorkloadPackage);
    if (
        hash !== member.manifestHash ||
        version.packageId !== member.packageId ||
        manifest.id !== member.packageId ||
        manifest.version !== version.version
    ) {
        badRequest('Workload package reference or manifestHash mismatch.');
    }
    assertWorkloadCurator(manifest.publisherDid);
    assertNoInlineWorkloadSecrets(
        config,
        manifest.secretRefs.map((secret): string => secret.name)
    );
    if (!manifest.targets.some((target): boolean => target.driver === 'local-compose')) {
        badRequest('Workload package does not support the local-compose driver.');
    }
    const validation = validateWorkloadConfig(manifest.configSchema, config);
    if (!validation.ok) badRequest(`Invalid workload config: ${validation.errors.join('; ')}`);
    const core = manifest.profiles.find((profile): boolean => profile.kind === 'core');
    if (!core) badRequest('Workload package has no core profile.');
    const selected = new Set([core.id, ...member.profiles]);
    for (const profileId of selected) {
        const profile = manifest.profiles.find((candidate): boolean => candidate.id === profileId);
        if (!profile) badRequest(`Unknown workload profile ${profileId}.`);
        for (const dependency of profile.requiresProfiles) {
            if (!selected.has(dependency))
                badRequest(`Profile ${profileId} requires profile ${dependency}.`);
        }
        if (profile.condition) {
            let value: unknown = config;
            for (const key of profile.condition.configPath.split('.')) {
                value =
                    value &&
                    typeof value === 'object' &&
                    Object.prototype.hasOwnProperty.call(value, key)
                        ? (value as Record<string, unknown>)[key]
                        : undefined;
            }
            if (value !== profile.condition.equals)
                badRequest(`Condition for workload profile ${profileId} is not satisfied.`);
        }
    }
    const componentIds = new Set(
        manifest.profiles
            .filter((profile): boolean => selected.has(profile.id))
            .flatMap((profile): string[] => profile.components)
    );
    const components = manifest.components.filter((component): boolean =>
        componentIds.has(component.id)
    );
    for (const component of components) {
        if (component.dependsOn.some((id): boolean => !componentIds.has(id)))
            badRequest(`Missing component dependency for ${component.id}.`);
        for (const entry of component.env) {
            if (entry.source.kind !== 'endpoint') continue;
            const endpointId = entry.source.endpointId;
            const endpoint = manifest.endpoints.find(
                (candidate): boolean => candidate.id === endpointId
            );
            if (!endpoint || !componentIds.has(endpoint.component)) {
                badRequest(
                    `Missing selected endpoint ${endpointId} for component ${component.id}.`
                );
            }
        }
    }
    // Host CPU architecture is deliberately checked by the phase-4 agent, not brain.
    return {
        packageId: manifest.id,
        packageVersionId: version.versionId,
        version: manifest.version,
        manifestHash: hash,
        publisherDid: manifest.publisherDid,
        profiles: [...selected].sort(),
        components: components
            .map(({ id, image, platform }): WorkloadPlan['components'][number] => ({
                id,
                image,
                platform,
            }))
            .sort((a, b): number => a.id.localeCompare(b.id)),
        module: {
            sha256: manifest.artifacts.module.ref.sha256,
            rendererVersion: manifest.artifacts.module.rendererVersion,
        },
        endpoints: manifest.endpoints.filter((endpoint): boolean =>
            componentIds.has(endpoint.component)
        ),
        supportBoundary: manifest.supportBoundary,
        secrets: manifest.secretRefs
            .filter((secret): boolean =>
                secret.consumers.some((id): boolean => componentIds.has(id))
            )
            .map((secret): WorkloadPlan['secrets'][number] => ({
                name: secret.name,
                provisioningKind: secret.provisioning.kind,
            }))
            .sort((a, b): number => a.name.localeCompare(b.name)),
        driver: 'local-compose',
        bundle,
        platformValidation: 'DEFERRED_TO_AGENT',
        provides: manifest.provides
            .filter((entry): boolean => entry.profiles.every((id): boolean => selected.has(id)))
            .map((entry): WorkloadPlan['provides'][number] => entry.capability),
        consumes: manifest.consumes
            .filter((entry): boolean => entry.profiles.every((id): boolean => selected.has(id)))
            .map((entry): WorkloadPlan['consumes'][number] => entry.capability),
    };
};
