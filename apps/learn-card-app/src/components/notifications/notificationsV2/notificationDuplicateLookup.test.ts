import { describe, expect, it } from 'vitest';
import type { VC } from '@learncard/types';

import { getNotificationDuplicateLookup } from './notificationDuplicateLookup';

const openBadge = {
    id: 'urn:uuid:issued-open-badge',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
} as VC;

describe('getNotificationDuplicateLookup', () => {
    it('uses the source Boost URI supplied with new notifications', () => {
        expect(
            getNotificationDuplicateLookup(openBadge, {
                metadata: { boostUri: 'lc:network:example.org/trpc:boost:source-boost' },
            })
        ).toEqual({ boostUri: 'lc:network:example.org/trpc:boost:source-boost' });
    });

    it('falls back to stable content matching for legacy OpenBadge notifications', () => {
        expect(getNotificationDuplicateLookup(openBadge, undefined)).toEqual({
            compareByContent: true,
        });
    });
});
