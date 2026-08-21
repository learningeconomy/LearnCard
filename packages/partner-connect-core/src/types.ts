/** Wallet categories supported by LearnCard for inline-issued credentials. */
export type WalletCategory =
    | 'Achievement'
    | 'Skill'
    | 'ID'
    | 'Learning History'
    | 'Work History'
    | 'Social Badges'
    | 'Membership'
    | 'Accomplishment'
    | 'Experiences'
    | 'Accommodation'
    | 'Family';

/** Bare variable token like `{{courseName}}`. Variable names must match /^\w+$/. */
export type VariableToken = `{{${string}}}`;

/** Free text that may contain one or more `{{variables}}`. */
export type TemplateText = string;

/** HTTPS URL or a URL-like string that contains `{{variables}}`. */
export type TemplateUrl = string;

/** ISO-8601 date string or a bare `{{variable}}` token. */
export type TemplateDate = string;

/** A literal number or a bare `{{variable}}` token that resolves to a number. */
export type TemplateNumber = number | VariableToken;

/** Known OBv3 achievement type or a custom `ext:CamelCase` value. */
export type AchievementType = string;

export interface InlineAlignment {
    name: TemplateText;
    url: TemplateUrl;
    framework?: TemplateText;
    code?: TemplateText;
}

export interface InlineEvidence {
    id?: TemplateUrl;
    name?: TemplateText;
    narrative?: TemplateText;
}

export interface WalletSkillTag {
    frameworkId: string;
    id: string;
    proficiencyLevel?: string;
}

/**
 * Friendly inline credential template for LLMs and app authors.
 *
 * LearnCard will compile this into a canonical unsigned Open Badges v3 credential template.
 * Use `{{variableName}}` placeholders anywhere you want runtime data inserted.
 */
export interface SimpleInlineCredentialTemplate {
    rawCredential?: never;

    /**
     * Required human-readable credential title.
     *
     * This value is used for both the VC root `name` and `credentialSubject.achievement.name`.
     * Example: `"Course Completion: {{courseName}}"`.
     */
    name: TemplateText;

    /**
     * Optional plain-language description shown to learners.
     *
     * Good example: `"Awarded for successfully completing {{courseName}}."`
     */
    description?: TemplateText;

    /**
     * Optional badge or certificate image URL.
     *
     * Use an `https://` URL or a variableized URL such as
     * `"https://cdn.example.com/badges/{{badgeSlug}}.png"`.
     */
    image?: TemplateUrl;

    /**
     * Optional display name for the issuer.
     *
     * This is display-only. The issuer DID is always injected by LearnCard at issuance time.
     * Example: `"Example Academy"`.
     */
    issuerName?: TemplateText;

    /**
     * Optional Open Badges achievement type.
     *
     * Common values include: `Badge`, `Certificate`, `Course`, `Assessment`, `Degree`,
     * `License`, `Diploma`, `Certification`, `Award`, `CommunityService`, `Competency`,
     * `MicroCredential`, `LearningProgram`, `Membership`, `ProfessionalDevelopment`, and
     * `Achievement`.
     *
     * For custom types, use the `ext:` prefix with CamelCase, for example `ext:PartnerAward`.
     * Defaults to `Badge`.
     */
    achievementType?: AchievementType;

    /**
     * Optional LearnCard wallet category used for storage and filtering.
     *
     * Defaults to `Achievement`.
     */
    category?: WalletCategory;

    /**
     * Optional completion criteria shown inside the achievement block.
     *
     * Example:
     * `{ narrative: "Complete all {{moduleCount}} modules", url: "https://example.org/rubric" }`
     */
    criteria?: {
        /** Narrative instructions or rubric summary. */
        narrative?: TemplateText;
        /** Optional HTTPS URL for the full criteria or rubric. */
        url?: TemplateUrl;
    };

    /**
     * Optional standards alignments for the achievement.
     *
     * Each item should describe one external framework, competency, or standard mapping.
     */
    alignments?: InlineAlignment[];

    /**
     * Optional Open Badges tags.
     *
     * Use short search-friendly labels such as `"javascript"`, `"leadership"`, or
     * `"{{trackName}}"`.
     */
    tags?: TemplateText[];

    /**
     * Optional activity date window for when the learner completed the work.
     *
     * Each field may be a literal ISO date string like `"2026-07-20T00:00:00.000Z"`
     * or a bare variable like `"{{completionDate}}"`.
     */
    activity?: {
        /** Start date of the underlying activity or learning experience. */
        startDate?: TemplateDate;
        /** End date of the underlying activity or learning experience. */
        endDate?: TemplateDate;
    };

    /**
     * Optional credits metadata.
     *
     * Use literal numbers when fixed, or bare variables like `{{earnedCredits}}` when supplied later.
     */
    credits?: {
        /** Number of credits earned by the learner. */
        earned?: TemplateNumber;
        /** Total credits available for the program or achievement. */
        available?: TemplateNumber;
    };

    /**
     * Optional credential expiration date.
     *
     * Use an ISO-8601 string or a bare variable such as `"{{licenseExpiry}}"`.
     */
    validUntil?: TemplateDate;

    /**
     * Optional evidence entries that support the credential claim.
     *
     * Example: a project URL, portfolio item, transcript row, or rubric summary.
     */
    evidence?: InlineEvidence[];

    /**
     * Optional wallet-only skill tags.
     *
     * These are stored as LearnCard metadata and are NOT emitted into the credential JSON itself.
     */
    walletSkills?: WalletSkillTag[];
}

/** Raw credential template mode for advanced callers who already have credential JSON. */
export interface RawInlineCredentialTemplate {
    rawCredential: Record<string, unknown>;
    category?: WalletCategory;
    walletSkills?: WalletSkillTag[];
}

export type InlineCredentialTemplate = SimpleInlineCredentialTemplate | RawInlineCredentialTemplate;

export interface InlineTemplateValidationError {
    path: string;
    message: string;
}

export interface VariableManifest {
    variables: Record<string, { type: 'string' | 'number'; paths: string[] }>;
}

export interface CompiledInlineTemplate {
    credentialTemplateJson: string;
    variableManifest: VariableManifest;
    category: WalletCategory;
    walletSkills?: WalletSkillTag[];
}

export type PersonalField = 'name' | 'email' | 'phone' | 'birthDate' | 'country' | 'avatar';

export interface ConsentRequest {
    read?: {
        credentialCategories?: WalletCategory[];
        personalFields?: PersonalField[];
    };
    write?: {
        credentialCategories?: WalletCategory[];
    };
    reason?: string;
}

export interface NormalizedConsentScopes {
    read: {
        credentialCategories: WalletCategory[];
        personalFields: PersonalField[];
    };
    write: {
        credentialCategories: WalletCategory[];
    };
}

/**
 * A credential template captured while an app ran against the mock host or a
 * dev embed. Used to pre-create the template when the app is submitted to the
 * LearnCard App Store.
 */
export interface CapturedTemplateRecord {
    alias: string;
    template: InlineCredentialTemplate;
    /** Highest template version observed during capture. */
    version: number;
    /** ISO-8601 timestamp of the most recent use. */
    lastUsedAt: string;
}

/**
 * A consent request captured while an app ran against the mock host or a dev
 * embed. Scopes are stored normalized (sorted + deduped) so identical
 * requests coalesce.
 */
export interface CapturedConsentRecord {
    scopes: NormalizedConsentScopes;
    reason?: string;
    /** ISO-8601 timestamp of the most recent use. */
    lastUsedAt: string;
}

/**
 * Everything the SDK observed about an app's LearnCard integration surface.
 * Built up by the mock host during local development and handed to the
 * LearnCard App Store submission flow to pre-fill a listing, so developers
 * only need to review, edit, and submit.
 */
export interface CapturedAppManifest {
    manifestVersion: 1;
    /** Origin the app ran on while the manifest was captured. */
    appUrl: string;
    /** Best-effort app name (document.title). */
    suggestedName?: string;
    /** Best-effort icon URL (favicon / web app manifest icon). */
    suggestedIconUrl?: string;
    /**
     * App Store permissions derived from observed SDK calls, e.g.
     * 'request_identity', 'send_credential', 'request_consent',
     * 'launch_feature', 'credential_search', 'credential_by_id',
     * 'template_issuance'.
     */
    permissions: string[];
    /** Inline credential templates used, keyed by alias (unique). */
    templates: CapturedTemplateRecord[];
    /** Distinct consent scope sets requested. */
    consentRequests: CapturedConsentRecord[];
    /** Distinct feature paths passed to launchFeature. */
    featuresLaunched: string[];
    /** Distinct counter keys used. */
    counterKeys: string[];
    usedLearnerContext: boolean;
    usedNotifications: boolean;
    firstCapturedAt: string;
    lastUpdatedAt: string;
}
