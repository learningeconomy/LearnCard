import type { ConsentFlowContractChanges, ConsentFlowContractDetails } from '@learncard/types';
import type { ConsentContractFormValue } from './consentContractForm.types';

export const CONTRACT_FORM_EXTRA_CATEGORY_LABELS: Record<string, string> = {
    Transcript: 'consentUpdate.scope.transcripts.label',
    Certificate: 'consentUpdate.scope.certificates.label',
};

export const CONTRACT_FORM_TEXT_FIELDS = [
    'name',
    'subtitle',
    'description',
    'image',
    'reasonForAccessing',
    'redirectUrl',
] as const;

export const contractToFormValue = (
    contract: ConsentFlowContractDetails
): ConsentContractFormValue => ({
    contract: structuredClone(contract.contract),
    name: contract.name,
    subtitle: contract.subtitle ?? '',
    description: contract.description ?? '',
    image: contract.image ?? '',
    reasonForAccessing: contract.reasonForAccessing ?? '',
    redirectUrl: contract.redirectUrl ?? '',
    needsGuardianConsent: Boolean(contract.needsGuardianConsent),
});

/** Omitted fields stay untouched; individual deleted scopes are explicitly removed, not merged back. */
export const buildContractFormChanges = (
    baseline: ConsentFlowContractDetails,
    value: ConsentContractFormValue
): ConsentFlowContractChanges => {
    const previous = baseline;
    const changes: ConsentFlowContractChanges = {};
    for (const field of CONTRACT_FORM_TEXT_FIELDS) {
        if ((previous[field] ?? '') !== (value[field] ?? '')) changes[field] = value[field] ?? '';
    }
    if (Boolean(previous.needsGuardianConsent) !== Boolean(value.needsGuardianConsent)) {
        changes.needsGuardianConsent = value.needsGuardianConsent;
    }
    const access: NonNullable<ConsentFlowContractChanges['contract']> = {};
    for (const area of ['read', 'write'] as const) {
        const areaChanges: NonNullable<(typeof access)[typeof area]> = {};
        for (const type of ['credentials', 'personal'] as const) {
            const oldScopes =
                type === 'credentials'
                    ? previous.contract[area].credentials.categories
                    : previous.contract[area].personal;
            const newScopes =
                type === 'credentials'
                    ? value.contract[area].credentials.categories
                    : value.contract[area].personal;
            const patch: NonNullable<NonNullable<typeof access.read>['personal']> = {};
            for (const key of new Set([...Object.keys(oldScopes), ...Object.keys(newScopes)])) {
                const oldValue = oldScopes[key];
                const newValue = newScopes[key];
                if (
                    oldValue?.required === newValue?.required &&
                    oldValue?.defaultEnabled === newValue?.defaultEnabled &&
                    oldValue?.reason === newValue?.reason
                )
                    continue;
                patch[key] = newValue ?? null;
            }
            if (Object.keys(patch).length) {
                if (type === 'credentials') areaChanges.credentials = { categories: patch };
                else areaChanges.personal = patch;
            }
        }
        if (area === 'read' && previous.contract.read.anonymize !== value.contract.read.anonymize) {
            access.read = { ...areaChanges, anonymize: value.contract.read.anonymize };
        } else if (Object.keys(areaChanges).length) access[area] = areaChanges;
    }
    if (Object.keys(access).length) changes.contract = access;
    return changes;
};
