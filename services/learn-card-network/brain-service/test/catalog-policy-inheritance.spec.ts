import { beforeEach, describe, expect, it } from 'vitest';

import { Ecosystem, Group } from '@models';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { updateEcosystemSettings } from '@accesslayer/ecosystem/update';
import {
    getCatalogPolicyRevision,
    isListingAllowedByCatalogPolicy,
} from '@helpers/catalog-policy.helpers';

const baseInput = {
    name: 'State',
    slug: 'state',
    description: undefined,
    parentEcosystemId: null,
    ownerProfileId: 'owner-1',
    settings: {},
    status: 'ACTIVE' as const,
};

const allow = (allowedListings?: string[]) => ({
    catalogPolicy: { allowedListings, requireEndorsement: false },
});

describe('Catalog policy inheritance', () => {
    beforeEach(async () => {
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
    });

    it('lets a district use what its state enabled', async () => {
        const state = await createEcosystem({ ...baseInput, settings: allow(['lms']) });
        const district = await createEcosystem({
            ...baseInput,
            slug: 'district',
            parentEcosystemId: state.id,
        });

        expect(await isListingAllowedByCatalogPolicy(district.id, 'lms')).toBe(true);
        expect(await isListingAllowedByCatalogPolicy(district.id, 'other')).toBe(false);
    });

    it('never lets a district widen its state policy', async () => {
        const state = await createEcosystem({ ...baseInput, settings: allow(['lms']) });
        const district = await createEcosystem({
            ...baseInput,
            slug: 'district',
            parentEcosystemId: state.id,
            settings: allow(['lms', 'other']),
        });

        expect(await isListingAllowedByCatalogPolicy(district.id, 'other')).toBe(false);
    });

    it('lets a district restrict further', async () => {
        const state = await createEcosystem({ ...baseInput, settings: allow(['lms', 'wallet']) });
        const district = await createEcosystem({
            ...baseInput,
            slug: 'district',
            parentEcosystemId: state.id,
            settings: allow(['wallet']),
        });

        expect(await isListingAllowedByCatalogPolicy(district.id, 'lms')).toBe(false);
        expect(await isListingAllowedByCatalogPolicy(district.id, 'wallet')).toBe(true);
    });

    it('changes the district policy revision when the state withdraws a listing', async () => {
        const state = await createEcosystem({ ...baseInput, settings: allow(['lms', 'wallet']) });
        const district = await createEcosystem({
            ...baseInput,
            slug: 'district',
            parentEcosystemId: state.id,
        });
        const before = await getCatalogPolicyRevision(district.id);

        await updateEcosystemSettings(state.id, allow(['wallet']));

        expect(await getCatalogPolicyRevision(district.id)).not.toBe(before);
        expect(await isListingAllowedByCatalogPolicy(district.id, 'lms')).toBe(false);
    });
});
