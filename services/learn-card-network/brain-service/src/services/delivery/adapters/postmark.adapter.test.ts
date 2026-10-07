import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Notification } from '../delivery.service';

const mocks = vi.hoisted(() => ({ send: vi.fn(), legacySend: vi.fn(), render: vi.fn() }));
vi.mock('@environment', () => ({ environment: {} }));
vi.mock('postmark', () => ({
    ServerClient: class {
        sendEmail = mocks.send;
        sendEmailWithTemplate = mocks.legacySend;
    },
}));
vi.mock('@learncard/email-templates', () => ({
    resolveBranding: () => ({}),
    renderEmail: mocks.render,
}));
import { PostmarkAdapter } from './postmark.adapter';

const notification: Notification = {
    contactMethod: { type: 'email', value: 'holder@example.com' },
    templateId: 'credential-updated',
    templateModel: { issuer: { name: 'School' }, credential: { name: 'Biology' } },
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.render.mockResolvedValue({ html: '<p>Updated</p>', text: 'Updated', subject: 'Updated' });
    mocks.send.mockResolvedValue({});
});

describe('update email provider attempts', () => {
    it('sends the locally rendered update once', async () => {
        await new PostmarkAdapter('test-key').send(notification);
        expect(mocks.send).toHaveBeenCalledTimes(1);
        expect(mocks.legacySend).not.toHaveBeenCalled();
    });

    it('does not try a legacy template after an ambiguous provider failure', async () => {
        mocks.send.mockRejectedValueOnce(new Error('Acknowledgement lost'));
        await expect(new PostmarkAdapter('test-key').send(notification)).rejects.toThrow(
            'Acknowledgement lost'
        );
        expect(mocks.send).toHaveBeenCalledTimes(1);
        expect(mocks.legacySend).not.toHaveBeenCalled();
    });

    it('fails without sending when the local update template cannot render', async () => {
        mocks.render.mockRejectedValueOnce(new Error('Render failed'));
        await expect(new PostmarkAdapter('test-key').send(notification)).rejects.toThrow(
            'Render failed'
        );
        expect(mocks.send).not.toHaveBeenCalled();
        expect(mocks.legacySend).not.toHaveBeenCalled();
    });
});
