/**
 * LC-1901: make AI-generated boost text come back in the user's language.
 *
 * Only human-readable prose is translated — `category`/`type` enum values and
 * the JSON keys MUST stay English so the strict Zod validators keep parsing.
 */

/** Languages the app catalog ships. Anything else (including `en`) is a no-op. */
const AI_LOCALE_LANGUAGE_NAMES: Record<string, string> = {
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic',
};

/**
 * Narrow a BCP-47 tag (e.g. `es-MX`) to a supported language name, or `null`
 * for English / unsupported / absent — in which case the prompt is unchanged
 * and output stays English.
 */
export const resolveAiLanguage = (locale?: string): string | null => {
    if (!locale) return null;

    const base = locale.toLowerCase().split('-')[0] ?? '';

    return AI_LOCALE_LANGUAGE_NAMES[base] ?? null;
};

/**
 * The character rule for the generated title.
 *
 * The English prompt constrains titles to "letters A-Z", which keeps out
 * digits, emoji and punctuation. That rule directly contradicts asking for a
 * Spanish/French/Arabic title: `Álgebra` is not A-Z and Arabic has no A-Z at
 * all. Left conflicting, the model resolves it arbitrarily — stripping accents,
 * transliterating, or silently answering in English — and `AIResponseValidator`
 * can't catch it because `title` is a bare `z.string()`.
 *
 * So the constraint follows the language: same intent (letters only, no digits
 * or emoji), expressed against the target script.
 */
export const aiTitleCharsetRule = (locale?: string): string => {
    const language = resolveAiLanguage(locale);

    return language
        ? `using only ${language} letters (no digits, emoji, or punctuation)`
        : 'using only letters A-Z';
};

/**
 * System-prompt suffix telling the model which language to write prose in.
 * Returns `''` for English/unsupported so the prompt — and therefore the
 * output — is byte-identical to the pre-LC-1901 behavior.
 */
export const aiLocaleInstruction = (locale?: string): string => {
    const language = resolveAiLanguage(locale);

    if (!language) return '';

    return `\n\nLANGUAGE: Write the "title", "description", and "narrative" values in ${language}. Keep the "category" and "type" values, and all JSON keys, exactly as the English options specified above — do NOT translate or alter them.`;
};

/**
 * Suffix for the skills call. The skill hierarchy is a set of validated
 * identifiers, not prose, so it must stay English even when the rest of the
 * response is translated.
 */
export const aiSkillsHierarchyRule =
    'Keep every category, skill, and subskill value exactly as specified in the English skill hierarchy because they are validated identifiers, not user-facing prose.';
