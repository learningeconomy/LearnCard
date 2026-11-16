import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Notification } from '../delivery.service';

const mocks = vi.hoisted(() => ({
    send: vi.fn(),
    legacySend: vi.fn(),
    render: vi.fn(),
    stream: vi.fn(),
}));
vi.mock('@environment', () => ({ environment: {} }));
vi.mock('postmark', () => ({
    ServerClient: class {
        getMessageStream = mocks.stream;
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
    mocks.stream.mockResolvedValue({ MessageStreamType: 'Broadcasts' });
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

describe('campaign provider boundary', () => {
    const campaignNotification: Notification = {
        ...notification,
        templateId: 'campaign-announcement',
        subject: 'Authored subject',
        messageStream: 'news',
        headers: [
            {
                Name: 'List-Unsubscribe',
                Value: '<https://brain.example/campaigns/unsubscribe?token=test>',
            },
        ],
    };
    it('accepts the Postmark Broadcasts stream type and forwards headers and subject', async () => {
        await new PostmarkAdapter('test-key').send(campaignNotification);
        expect(mocks.stream).toHaveBeenCalledWith('news');
        expect(mocks.send).toHaveBeenCalledWith(
            expect.objectContaining({
                Subject: 'Authored subject',
                MessageStream: 'news',
                Headers: campaignNotification.headers,
            })
        );
    });
    it('validates one stream per wave and prepares without sending', async () => {
        const adapter = new PostmarkAdapter('test-key');
        await adapter.assertBroadcastStream('news');
        const first = await adapter.prepareCampaignEmail(campaignNotification);
        const second = await adapter.prepareCampaignEmail(campaignNotification);
        expect(mocks.stream).toHaveBeenCalledOnce();
        expect(mocks.render).toHaveBeenCalledTimes(2);
        expect(mocks.send).not.toHaveBeenCalled();
        await first();
        await second();
        expect(mocks.send).toHaveBeenCalledTimes(2);
    });
    it('does not cache failed stream checks', async () => {
        const adapter = new PostmarkAdapter('test-key');
        mocks.stream.mockRejectedValueOnce(new Error('provider private detail'));
        await expect(adapter.assertBroadcastStream('news')).rejects.toThrow(
            'stream validation failed'
        );
        await adapter.assertBroadcastStream('news');
        expect(mocks.stream).toHaveBeenCalledTimes(2);
    });
    it('rejects a custom transactional stream', async () => {
        mocks.stream.mockResolvedValue({ MessageStreamType: 'Transactional' });
        await expect(new PostmarkAdapter('test-key').send(campaignNotification)).rejects.toThrow(
            'Broadcast'
        );
        expect(mocks.send).not.toHaveBeenCalled();
    });
    it('never falls back to another send after an uncertain acknowledgement', async () => {
        mocks.send.mockRejectedValueOnce(new Error('timeout'));
        await expect(new PostmarkAdapter('test-key').send(campaignNotification)).rejects.toThrow(
            'timeout'
        );
        expect(mocks.send).toHaveBeenCalledOnce();
        expect(mocks.legacySend).not.toHaveBeenCalled();
    });
});
