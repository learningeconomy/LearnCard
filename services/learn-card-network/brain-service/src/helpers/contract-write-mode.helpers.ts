/**
 * LC-2423: the ConsentFlowTransaction action for a contract credential delivery.
 *
 * A write category on the holder's terms means the app may at least suggest. The
 * delivery is a direct 'write' only when neither the holder's terms nor the contract
 * set canWrite false for the boost's category (missing means true, so contracts and
 * terms from before LC-2423 keep direct write) and the sender did not ask for a
 * suggestion. Anything else lands as 'suggest', which clients never auto-accept.
 * Mirrors `contractWriteMode` in @learncard/helpers; the refusal case is handled by
 * the caller's existing category check.
 *
 * Expects `terms`, `contract` and `boost` (nullable) in scope and a `$forceSuggest`
 * parameter.
 */
export const contractWriteActionCypher = (
    terms = 'terms',
    contract = 'contract',
    boost = 'boost'
): string => `CASE
    WHEN coalesce($forceSuggest, false) THEN 'suggest'
    WHEN ${boost} IS NULL OR ${boost}.category IS NULL THEN 'write'
    WHEN ${terms}['terms.write.credentials.canWrite.' + ${boost}.category] = false THEN 'suggest'
    WHEN ${contract}['contract.write.credentials.categories.' + ${boost}.category + '.canWrite'] = false THEN 'suggest'
    ELSE 'write'
END`;

export type ContractWriteAction = 'write' | 'suggest';
