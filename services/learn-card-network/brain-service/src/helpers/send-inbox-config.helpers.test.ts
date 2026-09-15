import { describe, expect, it } from 'vitest';

import { buildInboxConfig } from './send-inbox-config.helpers';

const BOOST_URI = 'urn:lc:boost:abc';

describe('buildInboxConfig', () => {
    it('passes expiresInDays through to the inbox configuration', () => {
        expect(buildInboxConfig({ expiresInDays: 7 }, BOOST_URI)).toEqual({
            webhookUrl: undefined,
            boostUri: BOOST_URI,
            expiresInDays: 7,
        });
    });

    it('omits expiresInDays when not provided so the inbox default applies', () => {
        expect(
            buildInboxConfig({ webhookUrl: 'https://x.test/hook' }, BOOST_URI)
        ).not.toHaveProperty('expiresInDays');
        expect(buildInboxConfig(undefined, BOOST_URI)).not.toHaveProperty('expiresInDays');
    });

    it('keeps expiresInDays alongside the other inbox options', () => {
        const config = buildInboxConfig(
            {
                expiresInDays: 30,
                webhookUrl: 'https://x.test/hook',
                guardianEmail: 'parent@x.test',
                suppressDelivery: true,
                branding: { issuerName: 'Acme' },
            },
            BOOST_URI
        );

        expect(config).toMatchObject({
            expiresInDays: 30,
            webhookUrl: 'https://x.test/hook',
            guardianEmail: 'parent@x.test',
            delivery: { suppress: true, template: { model: { issuer: { name: 'Acme' } } } },
        });
    });
});
