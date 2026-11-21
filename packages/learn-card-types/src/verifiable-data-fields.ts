import { z } from 'zod';

export const VERIFIABLE_DATA_FIELD_PREFIX = 'VerifiableData:';
const identifier = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/);
/** Build ordinary ConsentFlow read categories, freezing the field list when the contract is created. */
export const requestProfileFields = (
    tenant: string,
    schemaKey: string,
    schemas: Record<string, { fields: Record<string, unknown> }>,
    fields?: string[],
    required = false
): Record<string, { required: boolean }> => {
    const schema = Object.prototype.hasOwnProperty.call(schemas, schemaKey) && schemas[schemaKey];
    if (!schema) throw new Error('Unknown profile schema');
    identifier.parse(tenant);
    identifier.parse(schemaKey);
    return Object.fromEntries(
        (fields ?? Object.keys(schema.fields)).map(field => {
            if (!Object.prototype.hasOwnProperty.call(schema.fields, field))
                throw new Error('Unknown profile field');
            return [
                `${VERIFIABLE_DATA_FIELD_PREFIX}${tenant}:${schemaKey}:${identifier.parse(field)}`,
                { required },
            ];
        })
    );
};
