import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { WorkloadPackage } from '@learncard/types';
import { t, profileRoute, openRoute } from '@routes';
import { publishWorkloadPackageVersion } from '@accesslayer/workload-package/create';
import {
    listWorkloadPackages,
    readWorkloadPackageVersion,
} from '@accesslayer/workload-package/read';
import { assertSignedWorkloadPackageOrThrow } from '@helpers/manifest-signature.helpers';
import type { WorkloadPackageRecord, WorkloadPackageVersionRecord } from 'types/workload-package';

type WorkloadPackageSummary = Pick<
    WorkloadPackage,
    'id' | 'version' | 'profiles' | 'endpoints' | 'supportBoundary' | 'provides' | 'consumes'
> & {
    manifestHash: string;
    components: Pick<WorkloadPackage['components'][number], 'id' | 'image' | 'platform'>[];
};

export const workloadPackagesRouter = t.router({
    publishWorkloadPackageVersion: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(z.object({ manifestJson: z.string().max(1_048_576) }))
        .mutation(async ({ input }): Promise<WorkloadPackageVersionRecord> =>
            publishWorkloadPackageVersion(input.manifestJson)
        ),
    getWorkloadPackageVersion: openRoute
        .input(z.object({ packageVersionId: z.string() }))
        .query(async ({ input }): Promise<WorkloadPackageSummary> => {
            const version = await readWorkloadPackageVersion(input.packageVersionId);
            if (!version)
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Workload package version not found.',
                });
            const manifest = await assertSignedWorkloadPackageOrThrow(version.manifestJson, {
                manifestHash: version.manifestHash,
            });
            return {
                id: manifest.id,
                version: manifest.version,
                manifestHash: version.manifestHash,
                profiles: manifest.profiles,
                components: manifest.components.map(
                    ({ id, image, platform }): WorkloadPackageSummary['components'][number] => ({
                        id,
                        image,
                        platform,
                    })
                ),
                endpoints: manifest.endpoints,
                supportBoundary: manifest.supportBoundary,
                provides: manifest.provides,
                consumes: manifest.consumes,
            };
        }),
    listWorkloadPackages: openRoute
        .input(z.object({}).default({}))
        .query(async (): Promise<WorkloadPackageRecord[]> => listWorkloadPackages()),
});
export type WorkloadPackagesRouter = typeof workloadPackagesRouter;
