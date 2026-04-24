import {
    queryJsonPath,
    satisfiesFilter,
    evaluateField,
    matchInputDescriptor,
} from './pex';
import { Field, InputDescriptor } from './types';

/** Sample VC used by most of the descriptor-level tests. */
const sampleVc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: 'did:web:issuer.example.com',
    issuanceDate: '2024-01-15T10:00:00Z',
    credentialSubject: {
        id: 'did:jwk:eyJ...',
        degree: {
            type: 'BachelorDegree',
            name: 'Bachelor of Science',
        },
        gpa: 3.85,
        citizen: true,
    },
    credentialSchema: {
        id: 'https://example.com/schemas/degree.json',
        type: 'FullJsonSchemaValidator2021',
    },
};

describe('queryJsonPath', () => {
    it('returns the root for $', () => {
        expect(queryJsonPath(sampleVc, '$')).toEqual([sampleVc]);
    });

    it('returns a single-element array for a simple property', () => {
        expect(queryJsonPath(sampleVc, '$.issuer')).toEqual([
            'did:web:issuer.example.com',
        ]);
    });

    it('walks nested properties with dot notation', () => {
        expect(queryJsonPath(sampleVc, '$.credentialSubject.degree.type')).toEqual([
            'BachelorDegree',
        ]);
    });

    it('returns an empty array when the path does not exist', () => {
        expect(queryJsonPath(sampleVc, '$.credentialSubject.nonexistent')).toEqual([]);
    });

    it('supports numeric array index', () => {
        expect(queryJsonPath(sampleVc, '$.type[0]')).toEqual(['VerifiableCredential']);
        expect(queryJsonPath(sampleVc, '$.type[1]')).toEqual([
            'UniversityDegreeCredential',
        ]);
    });

    it('supports [*] wildcard over arrays', () => {
        expect(queryJsonPath(sampleVc, '$.type[*]')).toEqual([
            'VerifiableCredential',
            'UniversityDegreeCredential',
        ]);
    });

    it('supports [*] wildcard over objects', () => {
        expect(queryJsonPath(sampleVc, '$.credentialSchema[*]')).toEqual([
            'https://example.com/schemas/degree.json',
            'FullJsonSchemaValidator2021',
        ]);
    });

    it('supports .* wildcard (dot notation)', () => {
        expect(queryJsonPath(sampleVc, '$.credentialSchema.*')).toEqual([
            'https://example.com/schemas/degree.json',
            'FullJsonSchemaValidator2021',
        ]);
    });

    it('supports recursive descent $..name', () => {
        const hits = queryJsonPath(sampleVc, '$..type');
        expect(hits).toEqual(
            expect.arrayContaining([
                ['VerifiableCredential', 'UniversityDegreeCredential'],
                'BachelorDegree',
                'FullJsonSchemaValidator2021',
            ])
        );
    });

    it('supports bracket-quoted property names', () => {
        expect(queryJsonPath(sampleVc, "$['@context']")).toEqual([
            ['https://www.w3.org/2018/credentials/v1'],
        ]);
        expect(queryJsonPath(sampleVc, '$["credentialSubject"]["id"]')).toEqual([
            'did:jwk:eyJ...',
        ]);
    });

    it('supports dot-notation on identifier-safe names with `@` and `:`', () => {
        // `@context` is valid, `:` shows up in fake DID-URL-like keys.
        expect(queryJsonPath(sampleVc, '$.@context')).toEqual([
            ['https://www.w3.org/2018/credentials/v1'],
        ]);
    });

    it('throws on unsupported filter predicates', () => {
        expect(() =>
            queryJsonPath(sampleVc, "$.credentialSubject[?(@.type=='X')]")
        ).toThrow(/filter expressions are not supported/);
    });

    it('throws on unsupported array slices', () => {
        expect(() => queryJsonPath(sampleVc, '$.type[0:2]')).toThrow(
            /array slicing is not supported/
        );
    });

    it('throws when path does not start with $', () => {
        expect(() => queryJsonPath(sampleVc, 'foo.bar')).toThrow(/must start with/);
    });
});

describe('satisfiesFilter', () => {
    describe('type', () => {
        it.each([
            ['string', 'hello', true],
            ['string', 42, false],
            ['number', 42, true],
            ['number', '42', false],
            ['integer', 42, true],
            ['integer', 4.2, false],
            ['boolean', true, true],
            ['boolean', 'true', false],
            ['array', [1, 2], true],
            ['array', { foo: 1 }, false],
            ['object', { foo: 1 }, true],
            ['object', [1, 2], false],
            ['null', null, true],
            ['null', undefined, false],
        ])('type=%s value=%p → %p', (type, value, expected) => {
            expect(satisfiesFilter(value, { type })).toBe(expected);
        });

        it('accepts union types (array of type names)', () => {
            expect(satisfiesFilter('x', { type: ['string', 'number'] })).toBe(true);
            expect(satisfiesFilter(1, { type: ['string', 'number'] })).toBe(true);
            expect(satisfiesFilter(true, { type: ['string', 'number'] })).toBe(false);
        });
    });

    describe('const', () => {
        it('matches primitive equality', () => {
            expect(satisfiesFilter('x', { const: 'x' })).toBe(true);
            expect(satisfiesFilter('x', { const: 'y' })).toBe(false);
            expect(satisfiesFilter(42, { const: 42 })).toBe(true);
        });

        it('matches deep equality on arrays and objects', () => {
            expect(satisfiesFilter([1, 2], { const: [1, 2] })).toBe(true);
            expect(satisfiesFilter([1, 2], { const: [2, 1] })).toBe(false);
            expect(
                satisfiesFilter({ a: 1, b: 2 }, { const: { a: 1, b: 2 } })
            ).toBe(true);
            expect(
                satisfiesFilter({ a: 1, b: 2 }, { const: { a: 1, b: 3 } })
            ).toBe(false);
        });
    });

    describe('enum', () => {
        it('matches when the value is in the allowed list', () => {
            expect(satisfiesFilter('a', { enum: ['a', 'b', 'c'] })).toBe(true);
            expect(satisfiesFilter('d', { enum: ['a', 'b', 'c'] })).toBe(false);
        });

        it('rejects when enum is not an array', () => {
            expect(satisfiesFilter('a', { enum: 'a' as unknown as unknown[] })).toBe(false);
        });
    });

    describe('pattern', () => {
        it('matches against a regex', () => {
            expect(
                satisfiesFilter('did:web:example.com', { pattern: '^did:web:' })
            ).toBe(true);
            expect(
                satisfiesFilter('did:key:zABC', { pattern: '^did:web:' })
            ).toBe(false);
        });

        it('returns false when value is not a string', () => {
            expect(satisfiesFilter(42, { pattern: '.' })).toBe(false);
        });

        it('returns false on invalid regex', () => {
            expect(satisfiesFilter('x', { pattern: '[' })).toBe(false);
        });
    });

    describe('numeric bounds', () => {
        it('honours minimum / maximum', () => {
            expect(satisfiesFilter(3.5, { type: 'number', minimum: 3.0 })).toBe(true);
            expect(satisfiesFilter(2.5, { type: 'number', minimum: 3.0 })).toBe(false);
            expect(satisfiesFilter(3.5, { type: 'number', maximum: 4.0 })).toBe(true);
            expect(satisfiesFilter(4.5, { type: 'number', maximum: 4.0 })).toBe(false);
        });

        it('honours exclusiveMinimum / exclusiveMaximum', () => {
            expect(satisfiesFilter(3.0, { exclusiveMinimum: 3.0 })).toBe(false);
            expect(satisfiesFilter(3.0001, { exclusiveMinimum: 3.0 })).toBe(true);
            expect(satisfiesFilter(4.0, { exclusiveMaximum: 4.0 })).toBe(false);
            expect(satisfiesFilter(3.9999, { exclusiveMaximum: 4.0 })).toBe(true);
        });
    });

    describe('string length', () => {
        it('honours minLength / maxLength', () => {
            expect(satisfiesFilter('abc', { minLength: 3 })).toBe(true);
            expect(satisfiesFilter('ab', { minLength: 3 })).toBe(false);
            expect(satisfiesFilter('abc', { maxLength: 3 })).toBe(true);
            expect(satisfiesFilter('abcd', { maxLength: 3 })).toBe(false);
        });
    });

    describe('array keywords', () => {
        it('contains: any item must satisfy the sub-filter', () => {
            expect(
                satisfiesFilter(
                    ['VerifiableCredential', 'UniversityDegreeCredential'],
                    { contains: { const: 'UniversityDegreeCredential' } }
                )
            ).toBe(true);
            expect(
                satisfiesFilter(['VerifiableCredential'], {
                    contains: { const: 'UniversityDegreeCredential' },
                })
            ).toBe(false);
        });

        it('items: every element must satisfy the sub-filter', () => {
            expect(satisfiesFilter([1, 2, 3], { items: { type: 'integer' } })).toBe(
                true
            );
            expect(
                satisfiesFilter([1, 'two', 3], { items: { type: 'integer' } })
            ).toBe(false);
        });

        it('minItems / maxItems', () => {
            expect(satisfiesFilter([1, 2], { minItems: 2 })).toBe(true);
            expect(satisfiesFilter([1], { minItems: 2 })).toBe(false);
            expect(satisfiesFilter([1, 2], { maxItems: 2 })).toBe(true);
            expect(satisfiesFilter([1, 2, 3], { maxItems: 2 })).toBe(false);
        });
    });

    it('is lenient about unknown keywords', () => {
        // Real verifiers sometimes include keywords like `format` or
        // `$comment`; we don't reject on them.
        expect(
            satisfiesFilter('x', {
                type: 'string',
                $comment: 'Testing',
                format: 'uri',
            })
        ).toBe(true);
    });
});

describe('evaluateField', () => {
    it('returns matched=true for a simple resolving path', () => {
        const field: Field = { path: ['$.issuer'] };
        const result = evaluateField(sampleVc, field);
        expect(result.matched).toBe(true);
        expect(result.matchedPath).toBe('$.issuer');
        expect(result.value).toBe('did:web:issuer.example.com');
    });

    it('tries paths in declared order, returning the first hit', () => {
        const field: Field = {
            path: ['$.nope', '$.credentialSubject.degree.type'],
        };
        const result = evaluateField(sampleVc, field);
        expect(result.matched).toBe(true);
        expect(result.matchedPath).toBe('$.credentialSubject.degree.type');
        expect(result.value).toBe('BachelorDegree');
    });

    it('rejects when filter does not accept the value', () => {
        const field: Field = {
            path: ['$.issuer'],
            filter: { type: 'string', const: 'did:web:other.example' },
        };
        const result = evaluateField(sampleVc, field);
        expect(result.matched).toBe(false);
        expect(result.reason).toMatch(/filter/);
    });

    it('accepts when filter matches', () => {
        const field: Field = {
            path: ['$.issuer'],
            filter: { type: 'string', pattern: '^did:web:' },
        };
        const result = evaluateField(sampleVc, field);
        expect(result.matched).toBe(true);
    });

    it('scans multiple matched values from a wildcard for filter match', () => {
        const field: Field = {
            path: ['$.type[*]'],
            filter: { const: 'UniversityDegreeCredential' },
        };
        const result = evaluateField(sampleVc, field);
        expect(result.matched).toBe(true);
        expect(result.value).toBe('UniversityDegreeCredential');
    });

    it('treats optional fields as matched when nothing resolves', () => {
        const field: Field = { path: ['$.nonexistent'], optional: true };
        const result = evaluateField(sampleVc, field);
        expect(result.matched).toBe(true);
    });

    it('returns a helpful reason on an invalid path', () => {
        const field: Field = { path: ['invalid'] };
        const result = evaluateField(sampleVc, field);
        expect(result.matched).toBe(false);
        expect(result.reason).toMatch(/must start with/);
    });

    it('rejects when path array is empty', () => {
        const result = evaluateField(sampleVc, { path: [] });
        expect(result.matched).toBe(false);
        expect(result.reason).toMatch(/no `path/);
    });
});

describe('matchInputDescriptor', () => {
    const degreeDescriptor: InputDescriptor = {
        id: 'university-degree',
        name: 'University degree',
        constraints: {
            fields: [
                {
                    path: ['$.type'],
                    filter: {
                        type: 'array',
                        contains: { const: 'UniversityDegreeCredential' },
                    },
                },
                {
                    path: ['$.credentialSubject.degree.type'],
                    filter: { type: 'string', pattern: '^Bachelor' },
                },
            ],
        },
    };

    it('matches when every required field resolves and passes its filter', () => {
        const result = matchInputDescriptor(sampleVc, degreeDescriptor);

        expect(result.matched).toBe(true);
        expect(result.descriptorId).toBe('university-degree');
        expect(result.fields).toHaveLength(2);
        expect(result.fields.every(f => f.matched)).toBe(true);
    });

    it('fails on the first required field that does not match, with a reason', () => {
        const strict: InputDescriptor = {
            id: 'strict',
            constraints: {
                fields: [
                    {
                        path: ['$.credentialSubject.degree.type'],
                        filter: { type: 'string', const: 'MasterDegree' },
                    },
                ],
            },
        };

        const result = matchInputDescriptor(sampleVc, strict);

        expect(result.matched).toBe(false);
        expect(result.fields).toHaveLength(1);
        expect(result.fields[0].matched).toBe(false);
        expect(result.reason).toBeDefined();
    });

    it('short-circuits: second required field is never evaluated if first fails', () => {
        const descriptor: InputDescriptor = {
            id: 'short-circuit',
            constraints: {
                fields: [
                    {
                        path: ['$.issuer'],
                        filter: { const: 'did:web:wrong.example' },
                    },
                    { path: ['$.type'] },
                ],
            },
        };

        const result = matchInputDescriptor(sampleVc, descriptor);

        expect(result.matched).toBe(false);
        // Only the failing field was evaluated; the second was skipped.
        expect(result.fields).toHaveLength(1);
    });

    it('matches descriptor with no fields (constraints: {})', () => {
        const descriptor: InputDescriptor = {
            id: 'anything-goes',
            constraints: {},
        };

        expect(matchInputDescriptor(sampleVc, descriptor).matched).toBe(true);
    });

    it('honours optional fields inside a descriptor', () => {
        const descriptor: InputDescriptor = {
            id: 'optional-mix',
            constraints: {
                fields: [
                    { path: ['$.issuer'] }, // required — matches
                    { path: ['$.credentialSubject.ssn'], optional: true }, // no match, optional
                ],
            },
        };

        const result = matchInputDescriptor(sampleVc, descriptor);
        expect(result.matched).toBe(true);
    });
});
