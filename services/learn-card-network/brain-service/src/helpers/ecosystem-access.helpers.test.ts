import { describe, expect, it, vi } from 'vitest';
vi.mock('@instance', () => ({ neogma: {} }));
vi.mock('@accesslayer/install-intent/audit', () => ({ createInstallIntentAuditEvent: vi.fn() }));
vi.mock('@accesslayer/binding/read', () => ({ listBindingsByEcosystem: vi.fn() }));
import {
    serviceOperationClassification,
    requireServiceAccountAccess,
} from './ecosystem-access.helpers';
import { createInstallIntentAuditEvent } from '@accesslayer/install-intent/audit';

describe('Phase C service operation classification', () => {
    it('allows only group metadata read and denies subject data and unknown operations', () => {
        expect(serviceOperationClassification('group', 'read')).toBe('NON_SUBJECT');
        for (const [resource, action] of [
            ['profile', 'read'],
            ['group', 'sync'],
            ['group', '*'],
            ['*', 'read'],
            ['credential', 'read'],
            ['unknown', 'read'],
        ])
            expect(serviceOperationClassification(resource!, action!)).toBe('DENY');
    });
    it('audits anonymous denial without querying the graph', async () => {
        await expect(
            requireServiceAccountAccess({ resource: 'group', action: 'read', target: 'group' })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(createInstallIntentAuditEvent).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'SERVICE_ACCOUNT_ACCESS_DENY' })
        );
    });
});
