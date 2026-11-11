import { describe, it, expect, vi } from 'vitest';
import {
    SKILL_ICON_MAX_CHARACTERS_PER_REQUEST,
    SKILL_ICON_MAX_NAMES_PER_REQUEST,
    GenerateSkillIconsInputValidator,
} from '@learncard/types';

import {
    ICON_BATCH_CHARACTER_LIMIT,
    ICON_BATCH_CONCURRENCY,
    ICON_BATCH_NAME_LIMIT,
    annotateFrameworkWithIcons,
    generateIconsInBatches,
    splitNamesIntoIconBatches,
} from './skillIconHelpers';

const makeNames = (count: number, length = 5): string[] =>
    Array.from({ length: count }, (_, i) => `${i}`.padStart(length, 'n'));

const totalCharacters = (batch: string[]): number =>
    batch.reduce((total, name) => total + name.length, 0);

const iconsFor = (names: string[]): Record<string, string> =>
    Object.fromEntries(names.map(name => [name, '🎯']));

describe('icon batch limits', () => {
    it('match the server limits', () => {
        expect(ICON_BATCH_NAME_LIMIT).toBe(SKILL_ICON_MAX_NAMES_PER_REQUEST);
        expect(ICON_BATCH_CHARACTER_LIMIT).toBe(SKILL_ICON_MAX_CHARACTERS_PER_REQUEST);
        expect(ICON_BATCH_NAME_LIMIT).toBe(100);
        expect(ICON_BATCH_CHARACTER_LIMIT).toBe(2500);
    });
});

describe('splitNamesIntoIconBatches', () => {
    it('returns no batches for no names', () => {
        expect(splitNamesIntoIconBatches([])).toEqual([]);
    });

    it('keeps a small list in one batch', () => {
        const names = makeNames(10);

        expect(splitNamesIntoIconBatches(names)).toEqual([names]);
    });

    it('caps batches at the name limit when names are short', () => {
        const names = makeNames(250, 3);
        const batches = splitNamesIntoIconBatches(names);

        expect(batches.map(batch => batch.length)).toEqual([100, 100, 50]);
        expect(batches.flat()).toEqual(names);
    });

    it('caps batches at the character limit when names are long', () => {
        const names = makeNames(40, 100);
        const batches = splitNamesIntoIconBatches(names);

        expect(batches.map(batch => batch.length)).toEqual([25, 15]);
        batches.forEach(batch =>
            expect(totalCharacters(batch)).toBeLessThanOrEqual(ICON_BATCH_CHARACTER_LIMIT)
        );
        expect(batches.flat()).toEqual(names);
    });

    it('allows a batch to land exactly on both limits', () => {
        const names = makeNames(100, 25);
        const batches = splitNamesIntoIconBatches(names);

        expect(batches).toHaveLength(1);
        expect(totalCharacters(batches[0]!)).toBe(ICON_BATCH_CHARACTER_LIMIT);
    });

    it('starts a new batch as soon as one more name would exceed a limit', () => {
        expect(splitNamesIntoIconBatches(makeNames(101, 1)).map(b => b.length)).toEqual([100, 1]);
        expect(splitNamesIntoIconBatches(makeNames(101, 25)).map(b => b.length)).toEqual([100, 1]);
    });

    it('puts a single name larger than the character limit in its own batch', () => {
        const huge = 'x'.repeat(ICON_BATCH_CHARACTER_LIMIT + 500);
        const batches = splitNamesIntoIconBatches(['a', 'b', huge, 'c']);

        expect(batches).toEqual([['a', 'b'], [huge], ['c']]);
    });

    it('handles a huge name as the only name', () => {
        const huge = 'x'.repeat(ICON_BATCH_CHARACTER_LIMIT + 1);

        expect(splitNamesIntoIconBatches([huge])).toEqual([[huge]]);
    });

    it('produces batches the server validator accepts for a large framework', () => {
        const names = makeNames(1200, 30);

        splitNamesIntoIconBatches(names).forEach(batch =>
            expect(GenerateSkillIconsInputValidator.safeParse({ names: batch }).success).toBe(true)
        );
    });
});

describe('generateIconsInBatches', () => {
    it('merges the icons from every batch', async () => {
        const names = makeNames(250, 3);
        const generate = vi.fn(async (batch: string[]) => iconsFor(batch));

        const result = await generateIconsInBatches(names, generate);

        expect(generate).toHaveBeenCalledTimes(3);
        expect(Object.keys(result)).toHaveLength(250);
    });

    it('never sends a batch over either limit', async () => {
        const generate = vi.fn(async (batch: string[]) => iconsFor(batch));

        await generateIconsInBatches(makeNames(500, 40), generate);

        generate.mock.calls.forEach(([batch]) => {
            expect(batch.length).toBeLessThanOrEqual(ICON_BATCH_NAME_LIMIT);
            expect(totalCharacters(batch)).toBeLessThanOrEqual(ICON_BATCH_CHARACTER_LIMIT);
        });
    });

    it('does not call the generator when there are no names', async () => {
        const generate = vi.fn(async (batch: string[]) => iconsFor(batch));

        await expect(generateIconsInBatches([], generate)).resolves.toEqual({});
        expect(generate).not.toHaveBeenCalled();
    });

    it('de-duplicates names', async () => {
        const generate = vi.fn(async (batch: string[]) => iconsFor(batch));

        await generateIconsInBatches(['a', 'b', 'a', 'b'], generate);

        expect(generate).toHaveBeenCalledTimes(1);
        expect(generate).toHaveBeenCalledWith(['a', 'b']);
    });

    it('skips a single name too large to ever be accepted instead of sending it', async () => {
        const huge = 'x'.repeat(ICON_BATCH_CHARACTER_LIMIT + 1);
        const generate = vi.fn(async (batch: string[]) => iconsFor(batch));

        const result = await generateIconsInBatches(['a', huge, 'b'], generate);

        expect(generate).toHaveBeenCalledTimes(1);
        expect(generate).toHaveBeenCalledWith(['a', 'b']);
        expect(result).not.toHaveProperty(huge);
    });

    it('limits how many batches run at once', async () => {
        let inFlight = 0;
        let maxInFlight = 0;

        const generate = async (batch: string[]) => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise(resolve => setTimeout(resolve, 5));
            inFlight--;

            return iconsFor(batch);
        };

        await generateIconsInBatches(makeNames(1000, 3), generate);

        expect(maxInFlight).toBe(ICON_BATCH_CONCURRENCY);
        expect(ICON_BATCH_CONCURRENCY).toBeLessThanOrEqual(3);
    });

    it('runs batches sequentially when concurrency is 1', async () => {
        let inFlight = 0;
        let maxInFlight = 0;

        const generate = async (batch: string[]) => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise(resolve => setTimeout(resolve, 1));
            inFlight--;

            return iconsFor(batch);
        };

        await generateIconsInBatches(makeNames(300, 3), generate, { concurrency: 1 });

        expect(maxInFlight).toBe(1);
    });

    it('reports progress as batches complete', async () => {
        const onProgress = vi.fn();

        await generateIconsInBatches(makeNames(250, 3), async batch => iconsFor(batch), {
            concurrency: 1,
            onProgress,
        });

        expect(onProgress.mock.calls).toEqual([
            [100, 250],
            [200, 250],
            [250, 250],
        ]);
    });

    it('rethrows a batch failure and stops starting new batches', async () => {
        const generate = vi.fn(async (batch: string[]) => {
            if (generate.mock.calls.length === 2) throw new Error('boom');

            return iconsFor(batch);
        });

        await expect(
            generateIconsInBatches(makeNames(500, 3), generate, { concurrency: 1 })
        ).rejects.toThrow('boom');
        expect(generate).toHaveBeenCalledTimes(2);
    });
});

describe('annotateFrameworkWithIcons', () => {
    it('batches large frameworks and applies every icon', async () => {
        const skills = makeNames(230, 4).map(name => ({
            id: name,
            targetName: name,
            targetFramework: 'f',
            subskills: [],
        }));
        const generate = vi.fn(async (batch: string[]) => iconsFor(batch));

        const result = await annotateFrameworkWithIcons(
            { id: 'f', name: 'f', skills } as never,
            generate
        );

        expect(generate).toHaveBeenCalledTimes(3);
        expect(result.skills?.every(skill => skill.icon === '🎯')).toBe(true);
    });
});
