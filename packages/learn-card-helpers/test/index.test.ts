import { isHex, RegExpTransformer } from '../src';

describe('isHex', () => {
    it('should accept valid hex', () => expect(isHex('123')).toBe(true));
    it('should reject invalid hex', () => expect(isHex('zzz')).toBe(false));
    it('should reject empty strings', () => expect(isHex('')).toBe(false));

    it('should accept lowercase letters', () => {
        expect(isHex('abc123')).toBe(true);
    });

    it('should accept uppercase letters', () => {
        expect(isHex('ABC123')).toBe(true);
    });

    it('should accept long strings', () => {
        expect(isHex('abc1230123456789abcdeffedcba9876543210'.repeat(20))).toBe(true);
    });
});

describe('RegExp Transformer', () => {
    describe('serialization', () => {
        it('should serialize a simple RegExp', () => {
            const input = { pattern: /hello/g };
            const serialized = RegExpTransformer.serialize(input);
            expect(serialized).toBe('{"pattern":"/hello/g"}');
        });

        it('should serialize nested RegExp objects', () => {
            const input = { nested: { regex: /test/i } };
            const serialized = RegExpTransformer.serialize(input);
            expect(serialized).toBe('{"nested":{"regex":"/test/i"}}');
        });

        it('should serialize arrays of RegExp', () => {
            const input = { array: [/one/g, /two/i] };
            const serialized = RegExpTransformer.serialize(input);
            expect(serialized).toBe('{"array":["/one/g","/two/i"]}');
        });

        it('should handle complex RegExp patterns', () => {
            const input = { pattern: /^test.*pattern$/gimsuy };
            const serialized = RegExpTransformer.serialize(input);
            expect(serialized).toBe('{"pattern":"/^test.*pattern$/gimsuy"}');
        });

        it('should preserve non-RegExp values', () => {
            const input = {
                regex: /test/g,
                string: 'hello',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
            };
            const serialized = RegExpTransformer.serialize(input);
            expect(JSON.parse(serialized)).toEqual({
                regex: '/test/g',
                string: 'hello',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
            });
        });
    });

    describe('deserialization', () => {
        it('should deserialize a simple RegExp', () => {
            const input = '{"pattern":"/hello/g"}';
            const deserialized = RegExpTransformer.deserialize(input);
            expect(deserialized.pattern).toBeInstanceOf(RegExp);
            expect(deserialized.pattern.toString()).toBe('/hello/g');
        });

        it('should deserialize nested RegExp objects', () => {
            const input = '{"nested":{"regex":"/test/i"}}';
            const deserialized = RegExpTransformer.deserialize(input);
            expect(deserialized.nested.regex).toBeInstanceOf(RegExp);
            expect(deserialized.nested.regex.toString()).toBe('/test/i');
        });

        it('should deserialize arrays of RegExp', () => {
            const input = '{"array":["/one/g","/two/i"]}';
            const deserialized = RegExpTransformer.deserialize(input);
            expect(deserialized.array[0]).toBeInstanceOf(RegExp);
            expect(deserialized.array[1]).toBeInstanceOf(RegExp);
            expect(deserialized.array.map(r => r.toString())).toEqual(['/one/g', '/two/i']);
        });

        it('should handle complex RegExp patterns', () => {
            const input = '{"pattern":"/^test.*pattern$/gimsuy"}';
            const deserialized = RegExpTransformer.deserialize(input);
            expect(deserialized.pattern).toBeInstanceOf(RegExp);
            expect(deserialized.pattern.toString()).toBe('/^test.*pattern$/gimsuy');
        });

        it('should preserve non-RegExp values during deserialization', () => {
            const input =
                '{"regex":"/test/g","string":"hello","number":42,"boolean":true,"null":null,"array":[1,2,3]}';
            const deserialized = RegExpTransformer.deserialize(input);
            expect(deserialized).toEqual({
                regex: /test/g,
                string: 'hello',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
            });
        });

        it('should handle invalid RegExp patterns gracefully', () => {
            const input = '{"pattern":"/[invalid/g"}';
            expect(() => RegExpTransformer.deserialize(input)).not.toThrow();
            const deserialized = RegExpTransformer.deserialize(input);
            expect(deserialized.pattern).toBe('/[invalid/g');
        });
    });

    describe('roundtrip', () => {
        it('should preserve RegExp objects through serialize/deserialize cycle', () => {
            const original = {
                simple: /test/g,
                complex: /^test.*pattern$/gimsuy,
                nested: { regex: /nested/i },
                array: [/one/g, /two/m],
            };

            const roundtrip = RegExpTransformer.deserialize(RegExpTransformer.serialize(original));

            expect(roundtrip.simple).toBeInstanceOf(RegExp);
            expect(roundtrip.complex).toBeInstanceOf(RegExp);
            expect(roundtrip.nested.regex).toBeInstanceOf(RegExp);
            expect(roundtrip.array[0]).toBeInstanceOf(RegExp);
            expect(roundtrip.array[1]).toBeInstanceOf(RegExp);

            expect(roundtrip.simple.toString()).toBe(original.simple.toString());
            expect(roundtrip.complex.toString()).toBe(original.complex.toString());
            expect(roundtrip.nested.regex.toString()).toBe(original.nested.regex.toString());
            expect(roundtrip.array[0].toString()).toBe(original.array[0].toString());
            expect(roundtrip.array[1].toString()).toBe(original.array[1].toString());
        });
    });
});
