import { neogma } from '@instance';
import {
    WorkloadPackageRecordValidator,
    WorkloadPackageVersionRecordValidator,
    type WorkloadPackageRecord,
    type WorkloadPackageVersionRecord,
} from 'types/workload-package';

export const readWorkloadPackageVersion = async (
    versionId: string
): Promise<WorkloadPackageVersionRecord | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (v:WorkloadPackageVersion {versionId: $versionId}) RETURN properties(v) AS version',
        { versionId }
    );
    return result.records[0]
        ? WorkloadPackageVersionRecordValidator.parse(result.records[0].get('version'))
        : null;
};

export const listWorkloadPackages = async (): Promise<WorkloadPackageRecord[]> => {
    const result = await neogma.queryRunner.run(
        'MATCH (p:WorkloadPackage) RETURN properties(p) AS package ORDER BY p.id'
    );
    return result.records.map((record): WorkloadPackageRecord =>
        WorkloadPackageRecordValidator.parse(record.get('package'))
    );
};
