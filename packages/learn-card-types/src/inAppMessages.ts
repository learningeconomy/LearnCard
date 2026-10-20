import { z } from 'zod';

/**
 * In-App Messages — schema for the LaunchDarkly JSON flag that drives
 * conditional, targeted user prompts across LearnCard apps.
 *
 * The flag value is a versioned list of messages. Each message carries its own
 * targeting predicate tree that is evaluated ON DEVICE, because the client
 * knows things LaunchDarkly's own targeting rules cannot reliably see — the
 * Capacitor platform, the native binary version, and (crucially) the live
 * Capgo/OTA bundle version. Keeping targeting in the JSON also makes the whole
 * system unit-testable without a live LaunchDarkly connection.
 *
 * Consumed by `useInAppMessages()` in `learn-card-base`.
 */

/** Runtime platform, as reported by `Capacitor.getPlatform()`. */
export const inAppMessagePlatformValidator = z.enum(['ios', 'android', 'web']);
export type InAppMessagePlatform = z.infer<typeof inAppMessagePlatformValidator>;

/**
 * Which version number a `version` predicate compares against:
 *   - `native` — the installed native binary version (`App.getInfo().version`)
 *   - `web`    — the web build's package.json version (`__APP_VERSION__`)
 *   - `capgo`  — the live Capgo/OTA bundle version (`CapacitorUpdater.current()`)
 */
export const inAppMessageVersionSourceValidator = z.enum(['native', 'web', 'capgo']);
export type InAppMessageVersionSource = z.infer<typeof inAppMessageVersionSourceValidator>;

/** Semantic-version comparison operator (less-than, ..., greater-than). */
export const inAppMessageVersionOpValidator = z.enum(['lt', 'lte', 'eq', 'gte', 'gt']);
export type InAppMessageVersionOp = z.infer<typeof inAppMessageVersionOpValidator>;

/** Match when the runtime platform is one of the listed platforms. */
export const platformPredicateValidator = z
    .object({ platform: z.array(inAppMessagePlatformValidator).nonempty() })
    .strict();

/** Match when the current user's profile role is one of the listed roles. */
export const rolePredicateValidator = z.object({ role: z.array(z.string()).nonempty() }).strict();

/** Match when a chosen version source satisfies a semver comparison. */
export const versionPredicateValidator = z
    .object({
        version: z
            .object({
                source: inAppMessageVersionSourceValidator,
                op: inAppMessageVersionOpValidator,
                value: z.string(),
            })
            .strict(),
    })
    .strict();

const credentialMatchShape = {
    issuers: z.array(z.string()).nonempty().optional(),
    nestedIssuers: z.array(z.string()).nonempty().optional(),
    vcTypes: z.array(z.string()).nonempty().optional(),
    categories: z.array(z.string()).nonempty().optional(),
    achievementTypes: z.array(z.string()).nonempty().optional(),
    issuedWithinDays: z.number().positive().optional(),
};

/** All configured fields must match one credential; values within a field are OR'd. */
export const credentialMatchValidator = z
    .object(credentialMatchShape)
    .strict()
    .refine(value => Object.values(value).some(field => field !== undefined), {
        message: 'At least one credential match field is required',
    });
export type CredentialMatch = z.infer<typeof credentialMatchValidator>;

export const credentialPredicateValidator = z
    .object({
        credential: z
            .object({
                ...credentialMatchShape,
                minCount: z.number().int().positive().default(1),
            })
            .strict()
            .refine(
                value =>
                    Object.entries(value).some(
                        ([key, field]) => key !== 'minCount' && field !== undefined
                    ),
                { message: 'At least one credential match field is required' }
            ),
    })
    .strict();

export type InAppMessagePredicate =
    | z.infer<typeof platformPredicateValidator>
    | z.infer<typeof rolePredicateValidator>
    | z.infer<typeof versionPredicateValidator>
    | z.infer<typeof credentialPredicateValidator>
    | { all: InAppMessagePredicate[] }
    | { any: InAppMessagePredicate[] }
    | { not: InAppMessagePredicate };

export const inAppMessagePredicateValidator: z.ZodType<InAppMessagePredicate> = z.lazy(() =>
    z.union([
        platformPredicateValidator,
        rolePredicateValidator,
        versionPredicateValidator,
        credentialPredicateValidator,
        z.object({ all: z.array(inAppMessagePredicateValidator) }).strict(),
        z.object({ any: z.array(inAppMessagePredicateValidator) }).strict(),
        z.object({ not: inAppMessagePredicateValidator }).strict(),
    ])
);

/** Visual weight of an action button — maps to the app's button styles. */
export const inAppMessageActionStyleValidator = z
    .enum(['primary', 'secondary', 'positive', 'dismiss'])
    .default('secondary');
export type InAppMessageActionStyle = z.infer<typeof inAppMessageActionStyleValidator>;

// Action validators use .passthrough() (old clients tolerate new fields on
// actions), while predicate validators are .strict() so a typo in targeting
// fails closed at parse time instead of silently matching everyone.

/** Navigate to an in-app route (react-router path). */
export const internalLinkActionValidator = z
    .object({ type: z.literal('internalLink'), path: z.string() })
    .passthrough();

/** Open an external URL (native: Capacitor Browser; web: new tab). */
export const externalLinkActionValidator = z
    .object({ type: z.literal('externalLink'), url: z.string() })
    .passthrough();

/**
 * Open this app's store page, resolved per-platform at runtime:
 * iOS → App Store, Android → Google Play, web → configured fallback URL.
 * Optional overrides win over tenant-config-derived links.
 */
export const appStoreActionValidator = z
    .object({
        type: z.literal('appStore'),
        iosUrl: z.string().optional(),
        androidUrl: z.string().optional(),
        webUrl: z.string().optional(),
    })
    .passthrough();

/** Trigger a Capgo OTA bundle check + download (with progress) + reload. */
export type AppStoreAction = z.infer<typeof appStoreActionValidator>;

export const capgoUpdateActionValidator = z
    .object({ type: z.literal('capgoUpdate') })
    .passthrough();

/** Dismiss/close the message without any side effect. */
export const dismissActionValidator = z.object({ type: z.literal('dismiss') }).passthrough();

export const inAppMessageActionTargetValidator = z.union([
    internalLinkActionValidator,
    externalLinkActionValidator,
    appStoreActionValidator,
    capgoUpdateActionValidator,
    dismissActionValidator,
]);
export type InAppMessageActionTarget = z.infer<typeof inAppMessageActionTargetValidator>;

export const inAppMessageActionValidator = z
    .object({
        label: z.string(),
        style: inAppMessageActionStyleValidator,
        action: inAppMessageActionTargetValidator,
        /** When true, the message closes after this action runs (default true). */
        closeOnComplete: z.boolean().default(true),
    })
    .passthrough();
export type InAppMessageAction = z.infer<typeof inAppMessageActionValidator>;

export const inAppMessageMediaValidator = z
    .object({
        type: z.enum(['youtube', 'image', 'gif']),
        url: z.string(),
        /** Aspect ratio hint, e.g. "16:9" or "1:1". Defaults to 16:9. */
        aspect: z.string().default('16:9'),
        /** Alt text for images/gifs (accessibility). */
        alt: z.string().optional(),
    })
    .passthrough();
export type InAppMessageMedia = z.infer<typeof inAppMessageMediaValidator>;

/**
 * How often a message may re-appear after being seen/dismissed:
 *   - `once`    — show a single time, ever (persisted forever)
 *   - `session` — at most once per app session (in-memory)
 *   - `always`  — every eligible render (no suppression)
 *   - `{ everyDays: n }` — again only after n days have elapsed
 */
export const inAppMessageFrequencyValidator = z
    .union([
        z.literal('once'),
        z.literal('session'),
        z.literal('always'),
        z.object({ everyDays: z.number().positive() }).strict(),
    ])
    .default('once');
export type InAppMessageFrequency = z.infer<typeof inAppMessageFrequencyValidator>;

export const inAppMessagePresentationValidator = z
    .enum(['modal', 'banner', 'toast', 'story', 'iframe'])
    .default('modal');
export type InAppMessagePresentation = z.infer<typeof inAppMessagePresentationValidator>;

export const inAppMessageTriggerValidator = z
    .object({
        event: z.enum(['credential.claimed', 'app.opened']),
        where: credentialMatchValidator.optional(),
        windowMinutes: z.number().positive().default(10),
    })
    .strict();
export type InAppMessageTrigger = z.infer<typeof inAppMessageTriggerValidator>;

export const inAppMessageSettingsValidator = z
    .object({
        maxBlockingPerSession: z.number().int().nonnegative().default(1),
        blockingCooldownHours: z.number().nonnegative().default(48),
    })
    .passthrough()
    .default({ maxBlockingPerSession: 1, blockingCooldownHours: 48 });
export type InAppMessageSettings = z.infer<typeof inAppMessageSettingsValidator>;

export const inAppMessageHttpsUrlValidator = z
    .string()
    .url()
    .refine(value => {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' && !url.username && !url.password;
        } catch {
            return false;
        }
    }, 'An HTTPS URL without embedded credentials is required');

export const inAppMessageStepValidator = z
    .object({
        title: z.string(),
        body: z.string().optional(),
        media: inAppMessageMediaValidator.optional(),
        emoji: z.string().optional(),
        actions: z.array(inAppMessageActionValidator).optional(),
    })
    .passthrough();
export type InAppMessageStep = z.infer<typeof inAppMessageStepValidator>;

/** Exact app-relative destination, including any explicitly approved query and fragment. */
export const inAppMessageInternalPathValidator = z
    .string()
    .refine(
        path =>
            path.startsWith('/') &&
            !path.startsWith('//') &&
            [...path].every(
                char =>
                    char.charCodeAt(0) > 32 &&
                    char.charCodeAt(0) !== 127 &&
                    char !== '\\' &&
                    !/\s/.test(char)
            ),
        'A single-slash app-relative path without whitespace or backslashes is required'
    );

export const inAppMessageIframeValidator = z
    .object({
        url: inAppMessageHttpsUrlValidator,
        title: z.string().optional(),
        loadTimeoutMs: z.number().int().positive().max(2147483647).default(10000),
        allowedInternalPaths: z.array(inAppMessageInternalPathValidator).default([]),
    })
    .passthrough();

export const inAppMessageLocalesValidator = z.record(
    z.string(),
    z
        .object({
            title: z.string().optional(),
            body: z.string().optional(),
            actionLabels: z.array(z.string().nullable()).optional(),
            steps: z
                .array(
                    z
                        .object({
                            title: z.string().optional(),
                            body: z.string().optional(),
                            actionLabels: z.array(z.string().nullable()).optional(),
                        })
                        .passthrough()
                        .nullable()
                )
                .optional(),
            iframeUrl: inAppMessageHttpsUrlValidator.optional(),
        })
        .passthrough()
);

export const inAppMessageValidator = z
    .object({
        /** Stable identifier — used to persist dismissal / frequency state. */
        id: z.string(),
        /** Higher priority wins when multiple messages match. Default 0. */
        priority: z.number().default(0),
        /** When false, the message is required; iframe errors still allow a host-owned close. */
        dismissible: z.boolean().default(true),
        frequency: inAppMessageFrequencyValidator,
        presentation: inAppMessagePresentationValidator,
        media: inAppMessageMediaValidator.optional(),
        /** Optional emoji hero glyph — rendered only when `media` is not set. */
        emoji: z.string().optional(),
        title: z.string(),
        body: z.string().optional(),
        actions: z.array(inAppMessageActionValidator).default([]),
        steps: z.array(inAppMessageStepValidator).optional(),
        iframe: inAppMessageIframeValidator.optional(),
        locales: inAppMessageLocalesValidator.optional(),
        /** Targeting predicate tree. Omitted → matches everyone. */
        targeting: inAppMessagePredicateValidator.optional(),
        /** Allow disabling a message without removing it from the flag. */
        enabled: z.boolean().default(true),
        trigger: inAppMessageTriggerValidator.optional(),
        bypassFatigue: z.boolean().default(false),
    })
    .passthrough()
    .superRefine((message, ctx) => {
        if (message.presentation === 'story') {
            message.steps?.slice(0, -1).forEach((step, index) => {
                if (step.actions !== undefined) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['steps', index, 'actions'],
                        message: 'Only the final story screen may define actions',
                    });
                }
            });
        }
        if (message.presentation === 'story' && !message.steps?.length) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['steps'],
                message: 'Stories require at least one screen',
            });
        }
        if (message.presentation === 'iframe' && !message.iframe) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['iframe'],
                message: 'Iframe configuration is required',
            });
        }
    });
export type InAppMessage = z.infer<typeof inAppMessageValidator>;

export const inAppMessagesFlagValidator = z
    .object({
        version: z.number().default(1),
        messages: z.array(inAppMessageValidator).default([]),
        settings: inAppMessageSettingsValidator,
    })
    .passthrough();
export type InAppMessagesFlag = z.infer<typeof inAppMessagesFlagValidator>;

/** Empty, safe default used when the flag is absent or malformed. */
export const EMPTY_IN_APP_MESSAGES_FLAG: InAppMessagesFlag = {
    version: 1,
    messages: [],
    settings: { maxBlockingPerSession: 1, blockingCooldownHours: 48 },
};

export interface InvalidInAppMessage {
    id?: string;
    error: string;
}

export interface ParsedInAppMessagesFlag {
    flag: InAppMessagesFlag;
    invalid: InvalidInAppMessage[];
}

const inAppMessagesFlagEnvelopeValidator = z
    .object({
        version: z.number().default(1),
        messages: z.array(z.unknown()).default([]),
        settings: inAppMessageSettingsValidator,
    })
    .passthrough();

export const parseInAppMessagesFlagWithErrors = (raw: unknown): ParsedInAppMessagesFlag => {
    const envelope = inAppMessagesFlagEnvelopeValidator.safeParse(raw);

    if (!envelope.success) {
        return {
            flag: EMPTY_IN_APP_MESSAGES_FLAG,
            invalid: [{ error: envelope.error.issues[0]?.message ?? 'Invalid flag' }],
        };
    }

    const messages: InAppMessage[] = [];
    const invalid: InvalidInAppMessage[] = [];

    envelope.data.messages.forEach(rawMessage => {
        const result = inAppMessageValidator.safeParse(rawMessage);

        if (result.success) {
            messages.push(result.data);
            return;
        }

        const id =
            typeof rawMessage === 'object' &&
            rawMessage !== null &&
            'id' in rawMessage &&
            typeof rawMessage.id === 'string'
                ? rawMessage.id
                : undefined;
        const issue = result.error.issues[0];
        const path = issue?.path.join('.');

        invalid.push({
            ...(id ? { id } : {}),
            error: `${path ? `${path}: ` : ''}${issue?.message ?? 'Invalid message'}`,
        });
    });

    return {
        flag: {
            ...envelope.data,
            messages,
        },
        invalid,
    };
};

/**
 * Parse an unknown flag value into a validated `InAppMessagesFlag`.
 * Returns the empty flag (never throws) so a malformed flag can never crash
 * the host app.
 */
export const parseInAppMessagesFlag = (raw: unknown): InAppMessagesFlag => {
    return parseInAppMessagesFlagWithErrors(raw).flag;
};
