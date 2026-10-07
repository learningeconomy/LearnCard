import { describe, expect, it } from 'vitest';

import { groupChannels } from './channelGrouping';

const names = (list: string[]) => list.map(name => ({ name }));
const values = (opts: { value: string }[]) => opts.map(o => o.value);

describe('groupChannels', () => {
    it('picks <production>-staging as Staging (Latest) and lists other versioned staging as older', () => {
        const grouped = groupChannels(
            names([
                '1.0.9',
                '1.0.8',
                '1.0.9-staging',
                '1.0.8-staging',
                '1.0.10-staging',
                'staging',
            ]),
            '1.0.9'
        );

        expect(grouped.productionLatest?.value).toBe('1.0.9');
        expect(values(grouped.productionOlder)).toEqual(['1.0.8']);
        expect(grouped.stagingLatest?.value).toBe('1.0.9-staging');
        expect(grouped.stagingLatest?.label).toBe('Staging (Latest)');
        expect(values(grouped.stagingOlder)).toEqual([
            '1.0.10-staging',
            '1.0.8-staging',
            'staging',
        ]);
    });

    it('synthesizes the expected staging channel when it is missing from the list', () => {
        const grouped = groupChannels(names(['1.0.9', '1.0.8-staging']), '1.0.9');

        expect(grouped.stagingLatest?.value).toBe('1.0.9-staging');
        expect(values(grouped.stagingOlder)).toEqual(['1.0.8-staging']);
    });

    it('falls back to the newest versioned staging channel when no production channel is known', () => {
        const grouped = groupChannels(
            names(['1.0.8-staging', '1.0.10-staging', '1.0.9-staging', 'staging']),
            undefined
        );

        expect(grouped.productionLatest).toBeUndefined();
        expect(grouped.stagingLatest?.value).toBe('1.0.10-staging');
        expect(values(grouped.stagingOlder)).toEqual(['1.0.9-staging', '1.0.8-staging', 'staging']);
    });

    it('never promotes the legacy unversioned staging channel to Latest', () => {
        const grouped = groupChannels(names(['staging']), undefined);

        expect(grouped.stagingLatest).toBeUndefined();
        expect(values(grouped.stagingOlder)).toEqual(['staging']);
    });

    it('sorts semver numerically, not lexically', () => {
        const grouped = groupChannels(
            names(['1.0.9-staging', '1.0.10-staging', '1.0.2-staging']),
            '1.0.10'
        );

        expect(grouped.stagingLatest?.value).toBe('1.0.10-staging');
        expect(values(grouped.stagingOlder)).toEqual(['1.0.9-staging', '1.0.2-staging']);
    });

    it('buckets pr-<n> channels newest first and ignores unknown names', () => {
        const grouped = groupChannels(names(['pr-12', 'pr-140', 'random-thing']), '1.0.9');

        expect(values(grouped.prPreviews)).toEqual(['pr-140', 'pr-12']);
        expect(grouped.prPreviews[0].label).toBe('Beta #140');
    });
});
