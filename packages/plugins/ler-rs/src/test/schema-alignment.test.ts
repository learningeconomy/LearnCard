import fs from 'fs';
import path from 'path';
import { Validator, ValidatorResult } from 'jsonschema';
import { getLerRsPlugin } from '../ler-rs';
import type { LERRSDependentLearnCard } from '../types';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type LERRSTypeSchema = {
    properties?: {
        type?: {
            enum?: string[];
        };
    };
};

const docsRoot = path.resolve(__dirname, '../../lers-docs');
const recruitingJsonRoot = path.join(docsRoot, 'recruiting/json');
const commonJsonRoot = path.join(docsRoot, 'common/json');
const lerRsTypeUriV44 = 'http://schema.hropenstandards.org/4.4/recruiting/json/ler-rs/LER-RSType.json';
const lerRsTypeUriV45 = 'http://schema.hropenstandards.org/4.5/recruiting/json/LER-RSType.json';

const loadJson = (filePath: string): JsonValue => JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonValue;

const isAbsoluteRef = (ref: string): boolean => /^([a-z]+:\/\/|#)/i.test(ref);

const absolutizeRefs = (value: JsonValue, baseFile: string): JsonValue => {
    if (Array.isArray(value)) return value.map(item => absolutizeRefs(item, baseFile));
    if (value && typeof value === 'object') {
        const output: Record<string, JsonValue> = {};
        for (const [key, raw] of Object.entries(value)) {
            if (key === '$ref' && typeof raw === 'string' && !isAbsoluteRef(raw)) {
                const [rawPath, fragment] = raw.split('#');
                const resolvedPath = path.resolve(path.dirname(baseFile), rawPath);
                output[key] = `file://${resolvedPath}${fragment !== undefined ? `#${fragment}` : ''}`;
            } else {
                output[key] = absolutizeRefs(raw as JsonValue, baseFile);
            }
        }
        return output;
    }
    return value;
};

const collectSchemaFiles = (rootDir: string): string[] => {
    const files: string[] = [];
    const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }
            if (entry.isFile() && fullPath.endsWith('.json') && !fullPath.includes(`${path.sep}samples${path.sep}`)) {
                files.push(fullPath);
            }
        }
    };
    walk(rootDir);
    return files;
};

const createSchemaValidator = (): Validator => {
    const validator = new Validator();
    const schemaFiles = [...collectSchemaFiles(recruitingJsonRoot), ...collectSchemaFiles(commonJsonRoot)];

    for (const schemaFile of schemaFiles) {
        const schema = absolutizeRefs(loadJson(schemaFile), schemaFile);
        validator.addSchema(schema, `file://${schemaFile}#`);
    }

    return validator;
};

const validateWithSchema = (validator: Validator, instance: JsonValue, schemaFile: string): ValidatorResult => {
    const schema = absolutizeRefs(loadJson(schemaFile), schemaFile);
    // LER-RS docs currently mix 4.4 enum in LER-RSType.json and 4.5 in VC wrapper samples.
    // Accept both URIs in tests while preserving the rest of the schema validation.
    if (schemaFile.endsWith('LER-RSType.json') && schema && typeof schema === 'object') {
        const schemaObject = schema as LERRSTypeSchema;
        const typeEnum = schemaObject.properties?.type?.enum;
        if (Array.isArray(typeEnum)) {
            const union = new Set<string>([...typeEnum, lerRsTypeUriV44, lerRsTypeUriV45]);
            if (schemaObject.properties?.type) {
                schemaObject.properties.type.enum = Array.from(union);
            }
        }
    }
    return validator.validate(instance, schema);
};

const formatErrors = (result: ValidatorResult): string =>
    result.errors.map(error => error.stack).join('\n');

describe('LER-RS schema alignment', () => {
    const validator = createSchemaValidator();

    it('validates the official VC wrapper sample against local schema', () => {
        const sampleVcWrapper = loadJson(path.join(recruitingJsonRoot, 'samples/ler-rs/LER-RS_V2_VCwrapper.json'));
        const vcSchema = path.join(recruitingJsonRoot, 'VerifiableCredentialLER-RSType.json');

        const result = validateWithSchema(validator, sampleVcWrapper, vcSchema);
        expect(result.errors).toHaveLength(0);
    });

    it('validates createLerRecord output against VC wrapper and LER-RS schemas', async () => {
        const issuerDid = 'did:example:issuer-123';
        const fakeLearnCard = {
            id: {
                did: (): string => issuerDid,
            },
            invoke: {
                issueCredential: async (unsignedCredential: JsonValue): Promise<JsonValue> => unsignedCredential,
                issuePresentation: async (unsignedPresentation: JsonValue): Promise<JsonValue> => unsignedPresentation,
                verifyPresentation: async (): Promise<{ errors: string[] }> => ({ errors: [] }),
                verifyCredential: async (): Promise<{ errors: string[] }> => ({ errors: [] }),
            },
        } as unknown as LERRSDependentLearnCard;

        const plugin = getLerRsPlugin(fakeLearnCard);
        const generated = await plugin.methods.createLerRecord(fakeLearnCard, {
            learnCard: fakeLearnCard,
            person: {
                id: 'did:example:subject-456',
                givenName: 'Ada',
                familyName: 'Lovelace',
                email: 'ada@example.com',
            },
            skills: ['Algorithms'],
            workHistory: [
                {
                    employer: 'Analytical Engines Inc',
                    position: 'Mathematician',
                    start: '1843-01-01',
                    end: '1852-11-27',
                },
            ],
            educationHistory: [
                {
                    institution: 'Self Study',
                    degree: 'Mathematics',
                    specializations: ['Computing'],
                },
            ],
            certifications: [
                {
                    name: 'Foundations of Computing',
                    issuingAuthority: {
                        tradeName: 'Royal Society',
                    },
                    status: 'Active',
                    effectiveTimePeriod: {
                        validFrom: '1845-01-01T00:00:00Z',
                        validTo: '1860-01-01T00:00:00Z',
                    },
                },
            ],
        });

        const vcSchema = path.join(recruitingJsonRoot, 'VerifiableCredentialLER-RSType.json');
        const lerRsSchema = path.join(recruitingJsonRoot, 'LER-RSType.json');

        const vcValidation = validateWithSchema(validator, generated as JsonValue, vcSchema);
        expect(vcValidation.errors).toHaveLength(0);

        const credentialSubject = (generated as { credentialSubject?: JsonValue }).credentialSubject;
        if (!credentialSubject) throw new Error('Generated credential is missing credentialSubject');
        const subjectValidation = validateWithSchema(validator, credentialSubject, lerRsSchema);
        if (subjectValidation.errors.length > 0) {
            throw new Error(formatErrors(subjectValidation));
        }
        expect(subjectValidation.errors).toHaveLength(0);
    });
});
