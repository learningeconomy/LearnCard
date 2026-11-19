import type { CredentialRecord } from '@learncard/types';
import type { BespokeLearnCard } from '../types/learn-card';

type FieldRecord = CredentialRecord<{
    issuanceDate?: string;
    sharedUris?: Record<string, string[]>;
}>;

/** Retry against the winning record after a competing tab or device commits. */
export const updateProfileFieldIndex = async (
    wallet: BespokeLearnCard,
    id: string,
    next: (current: FieldRecord | null) => FieldRecord | undefined
): Promise<FieldRecord | null> => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const records = await wallet.index.LearnCloud.get<FieldRecord>({ id });
        if (records.length > 1) throw new Error('Ambiguous profile field index record.');
        const current = records[0] ?? null;
        const replacement = next(current);
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
    updateProfileFieldIndex(wallet, record.id, current => {
        if (current?.uri === record.uri) return;
        if (
            current?.issuanceDate &&
            (current.issuanceDate > record.issuanceDate ||
                (current.issuanceDate === record.issuanceDate && current.uri > record.uri))
        )
            return;
        return record;
    });
