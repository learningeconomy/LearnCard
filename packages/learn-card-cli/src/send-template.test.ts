import { describe, expect, it } from 'vitest';
import { templateCredential, personalizeSendMjs } from './send';
import { SEND_FROM_TEMPLATE_MJS } from './generated/snippets';

describe('template sending', () => {
    it('personalizes replacement metacharacters literally', () => {
        const output = personalizeSendMjs('$&', { name: '$&', description: '$&' });
        expect(output).toContain('displayName: "$&"');
        expect(output).toContain('description: "$&"');
    });
    it('includes Boost terms needed when the network stamps boostId', () => {
        const credential = templateCredential('did:key:issuer');
        expect(credential['@context']).toContain('https://ctx.learncard.com/boosts/1.0.1.json');
        expect(credential.type).toContain('BoostCredential');
    });
    it('reuses the persisted template rather than creating another one', () => {
        expect(SEND_FROM_TEMPLATE_MJS).toContain('templateUri: process.env.TEMPLATE_URI');
        expect(SEND_FROM_TEMPLATE_MJS).not.toContain('createBoost');
    });
});
