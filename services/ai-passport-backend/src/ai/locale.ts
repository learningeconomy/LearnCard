import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * AI output localization (LC-1901).
 *
 * The LearnCard app sends the user's active language as a `locale` query param
 * (HTTP), a `locale` field on the WebSocket connection, or a `locale` field on
 * a queued job. We store it in a request-scoped AsyncLocalStorage and append a
 * "write your response in this language" instruction to the system prompt
 * inside `aiCall` / `streamingAiCall` (the single choke point every LLM call
 * flows through) — so no per-prompt threading is needed.
 *
 * Supported languages mirror the app catalog: en (default), es, fr, ar.
 */

const LANGUAGE_NAMES: Record<string, string> = {
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic',
};

export const normalizeAiLocale = (locale?: string | null): string => {
    if (!locale || typeof locale !== 'string') return 'en';
    const [base] = locale.toLowerCase().split('-');
    return base && Object.hasOwn(LANGUAGE_NAMES, base) ? base : 'en';
};

/** Narrow a BCP-47 tag (e.g. "es-MX") to a supported language name, or null for English/unknown. */
const resolveLanguageName = (locale?: string | null): string | null =>
    LANGUAGE_NAMES[normalizeAiLocale(locale)] ?? null;

/**
 * Build the system-prompt suffix that tells the model to respond in `locale`.
 * Returns "" for English or unsupported locales (no behavior change — default
 * output stays English).
 *
 * IMPORTANT: only human-readable prose is translated. JSON keys, enum values,
 * category/type values, IDs, URLs and DIDs MUST stay English so structured
 * (Zod-validated) outputs keep parsing.
 */
export const appendLocaleInstruction = (locale?: string | null): string => {
    const language = resolveLanguageName(locale);
    if (!language) return '';
    return `\n\nLANGUAGE REQUIREMENT: Write every human-readable text value in your response — titles, descriptions, summaries, narratives, assessment questions, conversational replies, and any other prose shown to the user — in ${language}. Do NOT translate JSON keys, field names, enum values, category names, type names, skill-hierarchy keys, IDs, URLs, or DIDs; keep all of those exactly as specified in English.`;
};

/** Request-scoped current locale. Set via {@link runWithLocale} at each entry point. */
const localeAls = new AsyncLocalStorage<string | undefined>();

/** Read the locale for the current async context (undefined → English). */
export const getCurrentLocale = (): string | undefined => localeAls.getStore();

/**
 * Run a request, WebSocket message, or queued job in an isolated locale context.
 * `AsyncLocalStorage.run` restores the previous context when the callback exits,
 * preventing one user's locale from leaking into another concurrent operation.
 */
export const runWithLocale = <Result>(
    locale: string | null | undefined,
    callback: () => Result
): Result => localeAls.run(locale || undefined, callback);
