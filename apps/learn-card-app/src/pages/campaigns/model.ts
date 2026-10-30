import Papa from 'papaparse';
import {
    CampaignAudienceSourceValidator,
    CreateCampaignInputValidator,
    inAppMessageValidator,
} from '@learncard/types';
import type { Campaign, CampaignStatus } from '@learncard/types';
import type { CampaignForm } from './types';

export const initialForm = (): CampaignForm => ({
    id: `campaign-${crypto.randomUUID()}`,
    name: '',
    inApp: true,
    notify: false,
    messageJson: JSON.stringify(
        {
            presentation: 'modal',
            title: 'Your campaign message',
            body: '',
            frequency: 'once',
            actions: [],
        },
        null,
        2
    ),
    title: '',
    body: '',
    startsAt: '',
    endsAt: '',
    excludeMinors: true,
    selfEnroll: false,
});

const localDate = (value?: string): string => {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, -1);
};

export const campaignToForm = (campaign: Campaign): CampaignForm => ({
    id: campaign.id,
    name: campaign.name,
    inApp: campaign.channels.includes('inApp'),
    notify: campaign.channels.includes('notify'),
    messageJson: campaign.message
        ? JSON.stringify(campaign.message, null, 2)
        : initialForm().messageJson,
    title: campaign.notification?.title ?? '',
    body: campaign.notification?.body ?? '',
    startsAt: localDate(campaign.startsAt),
    endsAt: localDate(campaign.endsAt),
    excludeMinors: campaign.excludeMinors,
    selfEnroll: campaign.selfEnroll,
});

/** Validate with the same schema as the server. Never silently repair invalid author JSON. */
export const validateForm = (form: CampaignForm, status: CampaignStatus = 'draft') => {
    let message: unknown;
    if (form.inApp) {
        try {
            message = JSON.parse(form.messageJson);
        } catch {
            return { errors: ['message: Enter valid JSON.'], data: undefined };
        }
    }
    const errors: string[] = [];
    const timestamp = (value: string, path: string): string | undefined => {
        if (!value) return undefined;
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) {
            errors.push(`${path}: Enter a valid date and time.`);
            return undefined;
        }
        return date.toISOString();
    };
    const result = CreateCampaignInputValidator.safeParse({
        id: form.id,
        name: form.name,
        status,
        channels: [form.inApp ? 'inApp' : null, form.notify ? 'notify' : null].filter(Boolean),
        message,
        notification: form.notify ? { title: form.title, body: form.body } : undefined,
        startsAt: timestamp(form.startsAt, 'startsAt'),
        endsAt: timestamp(form.endsAt, 'endsAt'),
        excludeMinors: form.excludeMinors,
        selfEnroll: form.selfEnroll,
    });
    if (!result.success)
        errors.push(
            ...result.error.issues.map(issue => {
                const path = issue.path.join('.') || 'campaign';
                const friendly: Record<string, string> = {
                    id: 'Use 3–64 lowercase letters, numbers or hyphens.',
                    name: 'Enter a campaign name (up to 200 characters).',
                    channels: 'Choose at least one channel.',
                    'notification.title': 'Enter a notification title.',
                    'notification.body': 'Enter a notification body.',
                };
                return `${path}: ${friendly[path] ?? issue.message}`;
            })
        );
    return { errors, data: result.success && errors.length === 0 ? result.data : undefined };
};

export const previewMessage = (form: CampaignForm) => {
    try {
        const raw = JSON.parse(form.messageJson);
        return inAppMessageValidator.safeParse({ ...raw, id: form.id || 'composer-preview' });
    } catch {
        return undefined;
    }
};

/** DID-only CSV: named column or one column, RFC CSV quoting, stable deduplication. */
export const parseAudienceCsv = (
    text: string
): { dids: string[]; duplicates: number; errors: string[] } => {
    const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), {
        skipEmptyLines: 'greedy',
        delimiter: ',',
    });
    const errors = parsed.errors.map(error => `CSV row ${(error.row ?? 0) + 1}: ${error.message}`);
    const rows = parsed.data;
    if (!rows.length) return { dids: [], duplicates: 0, errors: ['The CSV is empty.'] };
    const headers = rows[0].map(value => value.trim().toLowerCase());
    const didColumn = headers.indexOf('did');
    if (headers.filter(value => value === 'did').length > 1)
        errors.push('Use only one did column.');
    if (didColumn < 0 && rows.some(row => row.length !== 1))
        errors.push('Use a named did column or a single column.');
    const data = didColumn >= 0 ? rows.slice(1) : rows;
    const dids = new Set<string>();
    let duplicates = 0;
    data.forEach((row, index) => {
        const value = row[didColumn >= 0 ? didColumn : 0]?.trim() ?? '';
        if (
            !value.startsWith('did:') ||
            value.length <= 4 ||
            value.length > 2048 ||
            /\s/.test(value)
        ) {
            errors.push(
                `CSV row ${index + (didColumn >= 0 ? 2 : 1)}: Enter a valid did: identifier.`
            );
        } else if (dids.has(value)) duplicates++;
        else dids.add(value);
    });
    if (!data.length) errors.push('The CSV has no audience rows.');
    return { dids: [...dids], duplicates, errors };
};

export const audienceChunks = (dids: string[]): string[][] => {
    const chunks: string[][] = [];
    for (let i = 0; i < dids.length; i += 1000) chunks.push(dids.slice(i, i + 1000));
    return chunks;
};

/** Advanced source input uses the existing server contract without inventing audience APIs. */
export const parseAudienceSource = (text: string) => {
    try {
        const result = CampaignAudienceSourceValidator.safeParse(JSON.parse(text));
        return result.success
            ? { data: result.data, errors: [] }
            : {
                  data: undefined,
                  errors: result.error.issues.map(
                      issue => `${issue.path.join('.') || 'source'}: ${issue.message}`
                  ),
              };
    } catch {
        return { data: undefined, errors: ['source: Enter valid JSON.'] };
    }
};
