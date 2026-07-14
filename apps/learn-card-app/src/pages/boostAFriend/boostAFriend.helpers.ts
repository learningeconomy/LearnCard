import {
    OBv3CredentialTemplate,
    staticField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { templateToJson } from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { buildLcTags } from 'learn-card-base/helpers/displayTags.helpers';
import { deriveAccentColor } from 'learn-card-base/helpers/colorHelpers';
import { DisplayTypeEnum } from 'learn-card-base/helpers/display-types';
import { LCAStylesPackRegistryEntry } from 'learn-card-base';

export interface BoostFriendInput {
    title: string;
    subtype?: string;
    description: string;
    note?: string;
    issuerName?: string;
    imageUrl?: string;
    vibeColor?: string;
}

export const buildPreviewCredential = (input: {
    title: string;
    subtype?: string;
    description?: string;
    note?: string;
    vibeColor?: string;
    imageUrl?: string;
    issuerName?: string;
}): Record<string, unknown> => {
    const template = buildBoostFriendTemplate({
        title: input.title,
        subtype: input.subtype,
        description: input.description?.trim() || `A social badge for being a ${input.title}`,
        note: input.note,
        vibeColor: input.vibeColor,
        imageUrl: input.imageUrl,
        issuerName: input.issuerName,
    });
    const json = templateToJson(template) as Record<string, any>;

    json.validFrom = new Date().toISOString();
    if (json.issuer) {
        json.issuer.id = 'did:key:preview';
    }
    if (json.credentialSubject) {
        delete json.credentialSubject.id;
    }
    return json;
};

export const buildBoostFriendTemplate = (input: BoostFriendInput): OBv3CredentialTemplate => {
    const tags = buildLcTags({
        subtype: input.subtype?.trim() || input.title,
        displayType: DisplayTypeEnum.Badge,
        backgroundColor: input.vibeColor,
        accentColor: deriveAccentColor(input.vibeColor),
    });

    return {
        schemaType: 'obv3',
        contexts: DEFAULT_CONTEXTS,
        types: DEFAULT_TYPES,
        name: staticField(input.title),
        issuer: {
            id: systemField('issuer_did'),
            name: input.issuerName ? staticField(input.issuerName) : staticField(''),
        },
        credentialSubject: {
            id: systemField('recipient_did'),
            achievement: {
                name: staticField(input.title),
                description: staticField(input.description),
                achievementType: staticField('Badge'),
                ...(input.imageUrl ? { image: staticField(input.imageUrl) } : {}),
                ...(tags.length > 0 ? { tag: tags } : {}),
                criteria: {
                    narrative: staticField(input.note ?? ''),
                },
            },
        },
        validFrom: systemField('issue_date'),
        customFields: [],
    };
};

export interface BadgePreset {
    title: string;
    type: string;
    category?: string;
}

export const humanizeBadgeType = (type: string): string =>
    type
        .replace(/^ext:/, '')
        // split camelCase/PascalCase and acronym boundaries: "CLRCartographer" -> "CLR Cartographer"
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .trim();

export const getStylePackPresets = (
    stylePacks: LCAStylesPackRegistryEntry[] | undefined
): BadgePreset[] => {
    if (!stylePacks) return [];

    const seen = new Set<string>();
    const presets: BadgePreset[] = [];

    for (const entry of stylePacks) {
        if (!entry?.type) continue;
        // Dedupe by type: the same badge type may appear under different category
        // labels across packs (e.g. peerbadges "Culture & Cool" vs bundled "Social Badge").
        // Sources merge remote-first, so the remote pack's labeling wins.
        if (seen.has(entry.type)) continue;
        seen.add(entry.type);
        presets.push({
            title: entry.title?.trim() || humanizeBadgeType(entry.type),
            type: entry.type,
            category: entry.category,
        });
    }

    return presets;
};

export const resolveBadgeStyle = (
    preset: BadgePreset,
    stylePacks: LCAStylesPackRegistryEntry[] | undefined
): { imageUrl: string; backgroundColor?: string; description?: string; criteria?: string } => {
    const entry =
        stylePacks?.find(
            e => (!preset.category || e.category === preset.category) && e.type === preset.type
        ) ?? stylePacks?.find(e => e.type === preset.type);
    const imageUrl = entry?.url && entry.url.trim() ? entry.url : '';
    return {
        imageUrl,
        backgroundColor: entry?.backgroundColor,
        description: entry?.description,
        criteria: entry?.criteria,
    };
};

export const VIBE_COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
];
