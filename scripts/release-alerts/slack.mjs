#!/usr/bin/env node
/**
 * Post a release alert to the release-owner Slack channel.
 *
 * Usage: node scripts/release-alerts/slack.mjs <message-file>
 *
 * Env:
 *   SLACK_BOT_TOKEN      Bot token with chat:write (the bot must be in the channel,
 *                        or have chat:write.public for public channels).
 *   RELEASE_ALERT_CHANNEL Channel name or ID. Defaults to #release-owner.
 *
 * Exits non-zero when Slack rejects the message so a broken alert path is visible
 * instead of silently dropping the alert.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DEFAULT_CHANNEL = '#release-owner';

/**
 * Make untrusted text (log lines, API messages) safe inside a Slack mrkdwn
 * message: escape the control characters Slack requires and fold newlines so
 * one value cannot break out of a quote or bullet.
 */
export const escapeSlackText = value =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\s*\n\s*/g, ' ');

/**
 * Last resort when the bot cannot post to the release-owner channel (for
 * example it was never invited): send the same alert through the deploy-errors
 * incoming webhook so it is not lost. The caller still exits non-zero.
 */
export const postWebhookFallback = async ({
    text,
    webhook,
    channel,
    reason,
    fetchImpl = fetch,
}) => {
    const response = await fetchImpl(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: `[Could not post to ${channel}: ${reason}]\n${text}`,
        }),
    });
    if (!response.ok) throw new Error(`Fallback webhook returned HTTP ${response.status}`);
};

/**
 * Send `text` to Slack via chat.postMessage.
 * @returns {Promise<void>} Resolves when Slack accepts the message.
 */
export const postReleaseAlert = async ({
    text,
    token,
    channel = DEFAULT_CHANNEL,
    fetchImpl = fetch,
}) => {
    if (!token) throw new Error('SLACK_BOT_TOKEN is not set; cannot alert the release owner.');
    if (!text?.trim()) throw new Error('Refusing to post an empty release alert.');

    const response = await fetchImpl('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ channel, text, unfurl_links: false, unfurl_media: false }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
        const reason = body.error ?? `HTTP ${response.status}`;
        const hint =
            reason === 'not_in_channel' || reason === 'channel_not_found'
                ? ` Invite the Slack bot to ${channel}.`
                : '';
        throw new Error(`Slack rejected the release alert: ${reason}.${hint}`);
    }
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
    const file = process.argv[2];
    const channel = process.env.RELEASE_ALERT_CHANNEL || DEFAULT_CHANNEL;
    let text;
    try {
        if (!file) throw new Error('Usage: slack.mjs <message-file>');
        text = readFileSync(file, 'utf8');
        await postReleaseAlert({ text, token: process.env.SLACK_BOT_TOKEN, channel });
        console.log('Release alert posted.');
    } catch (error) {
        console.log(`::error::${error.message}`);
        const webhook = process.env.SLACK_FALLBACK_WEBHOOK;
        if (text && webhook) {
            try {
                await postWebhookFallback({ text, webhook, channel, reason: error.message });
                console.log('::warning::Release alert sent through the fallback webhook instead.');
            } catch (fallbackError) {
                console.log(`::error::${fallbackError.message}`);
            }
        }
        process.exit(1);
    }
}
