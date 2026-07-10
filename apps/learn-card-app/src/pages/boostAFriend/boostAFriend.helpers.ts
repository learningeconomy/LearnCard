import {
    OBv3CredentialTemplate,
    staticField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { buildLcTags } from 'learn-card-base/helpers/displayTags.helpers';
import { deriveAccentColor } from 'learn-card-base/helpers/colorHelpers';
import { DisplayTypeEnum } from 'learn-card-base/helpers/display-types';
import { CATEGORY_TO_SUBCATEGORY_LIST } from '../../components/boost/boost-options/boostOptions';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
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
}

export const getSocialBadgePresets = (): BadgePreset[] => {
    const list = CATEGORY_TO_SUBCATEGORY_LIST[BoostCategoryOptionsEnum.socialBadge] || [];
    return list.map(item => ({ title: item.title, type: item.type }));
};

export const resolveBadgeStyle = (
    preset: BadgePreset,
    stylePacks: LCAStylesPackRegistryEntry[] | undefined
): { imageUrl: string; backgroundColor?: string } => {
    const entry = stylePacks?.find(e => e.category === 'Social Badge' && e.type === preset.type);
    const imageUrl = entry?.url && entry.url.trim() ? entry.url : '';
    return { imageUrl, backgroundColor: entry?.backgroundColor };
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
