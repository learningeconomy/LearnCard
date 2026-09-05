import { describe, expect, it, vi } from 'vitest';

import {
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
    staticField,
    systemField,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { buildPreviewCredential } from './buildPreviewCredential';
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
    getFallBackImage: () => '/fallback-achievement.png',
}));

describe('buildPreviewCredential', () => {
    it('preserves the issuer image for anyone-with-a-link previews', () => {
        const template = {
            schemaType: 'obv3' as const,
            contexts: DEFAULT_CONTEXTS,
            types: DEFAULT_TYPES,
            name: staticField('Community Builder'),
            issuer: {
                id: systemField('issuer_did'),
                name: staticField(''),
            },
            credentialSubject: {
                id: systemField('recipient_did'),
                achievement: {
                    name: staticField('Community Builder'),
                    description: staticField('Recognizes community service.'),
                    achievementType: staticField('Badge'),
                },
            },
            validFrom: systemField('issue_date'),
            customFields: [],
        };

        const preview = buildPreviewCredential({
            template,
            previewValues: {},
            issuerDid: 'did:web:example.com:users:alex',
            issuerName: 'Alex Rivera',
            issuerImage: 'https://example.com/alex.png',
            currentUserDisplayName: 'Alex Rivera',
            recipientMode: 'link',
            recipients: [],
        });

        expect(preview.issuer).toEqual({
            id: 'did:web:example.com:users:alex',
            name: 'Alex Rivera',
            image: 'https://example.com/alex.png',
        });
    });
});
