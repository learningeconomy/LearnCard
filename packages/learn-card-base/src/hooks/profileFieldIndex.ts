import type { CredentialRecord } from '@learncard/types';
import type { BespokeLearnCard } from '../types/learn-card';
import { getProfileFieldGeneration } from './profileFieldGeneration';

type FieldRecord = CredentialRecord<{
    issuanceDate?: string;
    sharedUris?: Record<string, string[]>;
}>;

/** Retry against the winning record after a competing tab or device commits. */
export const updateProfileFieldIndex = async (
    wallet: BespokeLearnCard,
    id: string,
    next: (
        current: FieldRecord | null
    ) => FieldRecord | undefined | Promise<FieldRecord | undefined>
): Promise<FieldRecord | null> => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const records = (await wallet.invoke.learnCloudGetIndexRecordForUpdate(
            id
        )) as FieldRecord[];
        if (records.length > 1) throw new Error('Ambiguous profile field index record.');
        const current = records[0] ?? null;
        const replacement = await next(current);
        if (!replacement) return current;
        if (await wallet.invoke.learnCloudCompareAndSwapIndexRecord(current, replacement))
            return replacement;
    }
    throw new Error('The profile field changed while saving. Please retry.');
};

export const indexLatestProfileField = async (
    wallet: BespokeLearnCard,
    record: FieldRecord & { issuanceDate: string }
) =>
    updateProfileFieldIndex(wallet, record.id, async current => {
        if (current?.uri === record.uri) return;
        if (current?.issuanceDate) {
            const [currentGeneration, nextGeneration] = await Promise.all([
                getProfileFieldGeneration(current.uri, current.issuanceDate),
                getProfileFieldGeneration(record.uri, record.issuanceDate),
            ]);
            if (currentGeneration > nextGeneration) return;
        }
        return record;
    });
