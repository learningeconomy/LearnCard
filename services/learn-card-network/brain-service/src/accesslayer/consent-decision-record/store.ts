import { v4 as uuid } from 'uuid';
import { z } from 'zod';

import { ConsentDecisionRecordValidator } from '@learncard/types';
import { neogma } from '@instance';

type ConsentDecisionRecordType = z.infer<typeof ConsentDecisionRecordValidator>;

type FlatConsentDecisionRecord = Omit<
    ConsentDecisionRecordType,
    'consentActor' | 'consentTiers' | 'requestedScopes' | 'approvedScopes' | 'reasonCodes'
> & {
    consentActor: string;
    consentTiers: string;
    requestedScopes: string;
    approvedScopes: string;
    reasonCodes: string;
};

const serializeConsentDecisionRecord = (
    record: ConsentDecisionRecordType
): FlatConsentDecisionRecord => ({
    ...record,
    consentActor: JSON.stringify(record.consentActor),
    consentTiers: JSON.stringify(record.consentTiers),
    requestedScopes: JSON.stringify(record.requestedScopes),
    approvedScopes: JSON.stringify(record.approvedScopes),
    reasonCodes: JSON.stringify(record.reasonCodes),
});

const inflateConsentDecisionRecord = (
    flat: FlatConsentDecisionRecord
): ConsentDecisionRecordType => {
    return ConsentDecisionRecordValidator.parse({
        ...flat,
        consentActor: JSON.parse(flat.consentActor),
        consentTiers: JSON.parse(flat.consentTiers),
        requestedScopes: JSON.parse(flat.requestedScopes),
        approvedScopes: JSON.parse(flat.approvedScopes),
        reasonCodes: JSON.parse(flat.reasonCodes),
    });
};

export const appendConsentDecisionRecord = async (
    input: Omit<ConsentDecisionRecordType, 'id' | 'occurredAt'> & {
        id?: string;
        occurredAt?: string;
    }
): Promise<ConsentDecisionRecordType> => {
    const record = ConsentDecisionRecordValidator.parse({
        ...input,
        id: input.id ?? `cdr_${uuid()}`,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
    });

    await neogma.queryRunner.run(`CREATE (:ConsentDecisionRecord $record)`, {
        record: serializeConsentDecisionRecord(record),
    });

    return record;
};

export const getConsentDecisionRecordsForBinding = async (
    bindingId: string
): Promise<ConsentDecisionRecordType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (record:ConsentDecisionRecord { bindingId: $bindingId })
         RETURN record
         ORDER BY record.occurredAt ASC`,
        { bindingId }
    );

    return result.records.map(record =>
        inflateConsentDecisionRecord(record.get('record').properties as FlatConsentDecisionRecord)
    );
};
