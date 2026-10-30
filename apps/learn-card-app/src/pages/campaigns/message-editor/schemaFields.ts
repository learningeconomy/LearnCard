import { z } from 'zod';

export type MessageObject = Record<string, unknown>;
export type MessagePath = (string | number)[];
export const objectValue = (value: unknown): MessageObject =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as MessageObject)
        : {};

export const readMessageObject = (text: string): MessageObject | undefined => {
    try {
        const value: unknown = JSON.parse(text);
        return value !== null && typeof value === 'object' && !Array.isArray(value)
            ? (value as MessageObject)
            : undefined;
    } catch {
        return undefined;
    }
};

/** Patch only the edited value; retain unexposed and future passthrough properties. */
export const patchMessage = (value: unknown, path: MessagePath, next: unknown): unknown => {
    if (!path.length) return next;
    const [key, ...rest] = path;
    if (typeof key === 'number') {
        const items: unknown[] = Array.isArray(value) ? [...value] : [];
        items[key] = patchMessage(items[key], rest, next);
        return items;
    }
    const record = objectValue(value);
    const changed = patchMessage(Object.hasOwn(record, key) ? record[key] : undefined, rest, next);
    const result = { ...record, [key]: changed };
    if (changed === undefined) delete result[key];
    return result;
};

export const unwrapSchema = (schema: z.ZodType): z.ZodType => {
    if (
        schema instanceof z.ZodDefault ||
        schema instanceof z.ZodOptional ||
        schema instanceof z.ZodNullable ||
        schema instanceof z.ZodLazy
    ) {
        return unwrapSchema(schema.unwrap() as z.ZodType);
    }
    return schema;
};

/** Initial editing values may be incomplete; the shared validator remains authoritative. */
export const initialFieldValue = (schema: z.ZodType): unknown => {
    if (schema instanceof z.ZodDefault) return schema.parse(undefined);
    if (schema instanceof z.ZodOptional) return undefined;
    if (schema instanceof z.ZodNullable) return null;
    if (schema instanceof z.ZodLazy) return initialFieldValue(schema.unwrap() as z.ZodType);
    if (schema instanceof z.ZodObject)
        return Object.fromEntries(
            Object.entries(schema.shape as Record<string, z.ZodType>)
                .map(([key, field]) => [key, initialFieldValue(field)])
                .filter(([, value]) => value !== undefined)
        );
    if (schema instanceof z.ZodUnion) return initialFieldValue(schema.options[0] as z.ZodType);
    if (schema instanceof z.ZodLiteral) return [...schema.values][0];
    if (schema instanceof z.ZodEnum) return schema.options[0];
    if (schema instanceof z.ZodArray) return [];
    if (schema instanceof z.ZodRecord) return {};
    if (schema instanceof z.ZodBoolean) return false;
    if (schema instanceof z.ZodNumber) return 1;
    return '';
};

export const unionKey = (schema: z.ZodType): string => {
    const base = unwrapSchema(schema);
    if (base instanceof z.ZodLiteral) return String([...base.values][0]);
    if (base instanceof z.ZodObject) {
        const discriminator = base.shape.type;
        return discriminator instanceof z.ZodLiteral
            ? String([...discriminator.values][0])
            : Object.keys(base.shape)[0];
    }
    return base.type;
};

export const matchesUnionBranch = (schema: z.ZodType, value: unknown): boolean => {
    const base = unwrapSchema(schema);
    if (base instanceof z.ZodLiteral) return base.values.has(value as string);
    if (base instanceof z.ZodObject) {
        const record = objectValue(value);
        const discriminator = base.shape.type;
        return discriminator instanceof z.ZodLiteral
            ? discriminator.values.has(record.type as string)
            : Object.hasOwn(record, unionKey(base));
    }
    return base.safeParse(value).success;
};

/** Keep positional translations aligned when removing a screen or an action. */
export const removeMessageItem = (
    message: MessageObject,
    path: MessagePath,
    index: number
): MessageObject => {
    let items: unknown = message;
    for (const key of path)
        items =
            typeof key === 'number'
                ? Array.isArray(items)
                    ? items[key]
                    : undefined
                : objectValue(items)[key];
    const remove = (list: unknown): unknown =>
        Array.isArray(list) ? list.filter((_, i) => i !== index) : list;
    let result = objectValue(patchMessage(message, path, remove(items)));
    const translationPath =
        path.length === 1 && path[0] === 'steps'
            ? ['steps']
            : path.length === 1 && path[0] === 'actions'
              ? ['actionLabels']
              : path.length === 3 && path[0] === 'steps' && path[2] === 'actions'
                ? ['steps', path[1], 'actionLabels']
                : undefined;
    if (translationPath && message.locales) {
        for (const [locale, translation] of Object.entries(objectValue(message.locales))) {
            let list: unknown = translation;
            for (const key of translationPath)
                list =
                    typeof key === 'number'
                        ? Array.isArray(list)
                            ? list[key]
                            : undefined
                        : objectValue(list)[key];
            if (Array.isArray(list))
                result = objectValue(
                    patchMessage(result, ['locales', locale, ...translationPath], remove(list))
                );
        }
    }
    return result;
};

export const FIELD_LABELS: Record<string, string> = {
    title: 'Title',
    body: 'Body',
    presentation: 'Format',
    frequency: 'Frequency',
    everyDays: 'Days between messages',
    priority: 'Priority',
    dismissible: 'Allow dismissal',
    enabled: 'Message enabled',
    bypassFatigue: 'Bypass message limits',
    media: 'Media',
    type: 'Type',
    url: 'URL',
    aspect: 'Aspect ratio',
    alt: 'Alternative text',
    emoji: 'Hero symbol',
    actions: 'Buttons',
    label: 'Button label',
    style: 'Button style',
    action: 'Button action',
    closeOnComplete: 'Close after action',
    path: 'App path',
    listingId: 'App listing ID',
    messageId: 'Message ID',
    iosUrl: 'iOS store URL',
    androidUrl: 'Android store URL',
    webUrl: 'Web fallback URL',
    steps: 'Story screens',
    iframe: 'Embedded page',
    loadTimeoutMs: 'Load timeout (milliseconds)',
    allowedInternalPaths: 'Allowed app paths',
    targeting: 'Targeting conditions',
    platform: 'Platforms',
    role: 'Roles',
    version: 'Version condition',
    source: 'Version source',
    op: 'Comparison',
    value: 'Version',
    credential: 'Credential condition',
    issuers: 'Issuer identifiers',
    nestedIssuers: 'Nested issuer identifiers',
    vcTypes: 'Credential types',
    categories: 'Categories',
    achievementTypes: 'Achievement types',
    issuedWithinDays: 'Issued within days',
    minCount: 'Minimum matching credentials',
    all: 'All conditions',
    any: 'Any condition',
    not: 'Not condition',
    trigger: 'Event trigger',
    event: 'Event',
    where: 'Matching credential',
    windowMinutes: 'Event window (minutes)',
    locales: 'Translations',
    actionLabels: 'Translated button labels',
    iframeUrl: 'Translated embedded page URL',
};
export const OPTION_LABELS: Record<string, string> = {
    modal: 'Modal — centered dialog',
    banner: 'Banner',
    toast: 'Toast',
    story: 'Story — multiple screens',
    iframe: 'Embedded page — web only',
    once: 'Once per account',
    session: 'Once per session',
    always: 'Whenever eligible',
    everyDays: 'Every N days',
    internalLink: 'Go to an app page',
    externalLink: 'Open a website',
    appStore: 'Open the app store',
    capgoUpdate: 'Check for an app update',
    dismiss: 'Dismiss',
    openApp: 'Open an installed app',
    openMessage: 'Open another message',
    primary: 'Primary',
    secondary: 'Secondary',
    positive: 'Positive',
    image: 'Image',
    gif: 'GIF',
    youtube: 'YouTube',
    ios: 'iOS',
    android: 'Android',
    web: 'Web',
    native: 'Native app version',
    capgo: 'App bundle version',
    lt: 'Less than',
    lte: 'Less than or equal',
    eq: 'Equal',
    gte: 'Greater than or equal',
    gt: 'Greater than',
    'credential.claimed': 'Credential claimed',
    'app.opened': 'App opened',
    platform: 'Platform',
    role: 'Role',
    version: 'Version',
    credential: 'Credential',
    all: 'All conditions',
    any: 'Any condition',
    not: 'Not condition',
};
export const FIELD_HINTS: Record<string, string> = {
    frequency: 'Controls repeat display; private admin tests bypass frequency and targeting.',
    priority: 'Higher numbers appear first when several messages qualify.',
    dismissible: 'Required stories need a final-screen button that closes the message.',
    bypassFatigue: 'Allow this message to bypass the usual blocking-message limits.',
    media: 'Add an image, GIF, or YouTube video.',
    aspect: 'For example, 16:9 or 1:1.',
    actions:
        'For stories, message buttons apply to the final screen unless that screen overrides them.',
    iframe: 'HTTPS only. Embedded pages are supported on the web, not in native apps.',
    allowedInternalPaths:
        'Exact app paths the embedded page may open, including any query or fragment.',
    targeting: 'Combine platform, role, version and credential rules.',
    locales:
        'Add language tags such as en, es, or pt-BR. Empty overrides use the original content.',
    closeOnComplete: 'Close the message after this action succeeds.',
    trigger: 'Wait for a supported event before showing the message.',
};
