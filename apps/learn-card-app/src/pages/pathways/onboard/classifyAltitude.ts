/**
 * classifyAltitude — heuristic altitude detection over free-text input.
 *
 * The learner's arrival prompt on onboarding accepts any altitude:
 *
 *   - **Aspiration** — "I want to become an LPN", "pivot into product"
 *   - **Question**   — "How does neural network training work?"
 *   - **Action**     — "I want to write a scene today"
 *   - **Exploration** — "I've been curious about fiction lately"
 *
 * This module classifies which of the four a given string sits at
 * using a deterministic, purely local heuristic. No LLM, no network.
 * Good enough to drive altitude-aware rendering on the Today banner
 * and altitude-aware template ranking in the suggestion grid; a
 * future upgrade can swap this for an LLM-assisted classifier behind
 * the same interface.
 *
 * ## Why heuristic first
 *
 * Three reasons:
 *
 *   1. **Offline determinism.** The onboarding flow has a
 *      "cold-start always renders in under 10s without network"
 *      invariant (docs § 6). A network-dependent classifier would
 *      break it.
 *   2. **Debuggability.** The learner can see *why* their input was
 *      classified a particular way (`signals[]`), which is close to
 *      impossible for an opaque LLM call and important for the
 *      product's "explain yourself" ethos.
 *   3. **Cost.** Every keystroke a learner types should be
 *      classifiable cheaply; we don't want to gate altitude-aware
 *      affordances behind a spinner.
 *
 * ## Precedence (highest altitude signal wins)
 *
 *   1. **Question** — ends with `?`, or starts with a WH-word, or
 *      contains a classic question pattern (`"is it"`, `"do I"`,
 *      `"can you"`, etc.). Most specific; rarely false positive.
 *   2. **Action** — contains an immediacy marker (`"today"`,
 *      `"right now"`, `"tonight"`, `"tomorrow"`, `"this week"`) *or*
 *      an explicit first-person action pattern (`"I want to [verb]
 *      a/the [noun]"` where the verb suggests doing-now).
 *   3. **Exploration** — contains a curiosity marker (`"curious"`,
 *      `"interested in"`, `"exploring"`, `"been reading"`,
 *      `"wondering"`, `"noticing"`).
 *   4. **Aspiration** — default. All the existing template-matching
 *      examples fall here (`"become an LPN"`, `"prepare for
 *      interviews"`, `"ship a portfolio"`), which preserves the
 *      pre-altitude behavior for backwards compatibility.
 *
 * Empty / whitespace input → aspiration + `confidence: 'low'`, so
 * the caller can decide whether to surface a softer prompt.
 */

import type { Altitude } from '../types';

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

export interface AltitudeClassification {
    altitude: Altitude;
    /**
     * How confident the heuristic is. `low` means "defaulted" — the
     * caller may want to prompt the learner for clarification. `high`
     * means a strong textual signal matched (e.g. ends with `?`).
     */
    confidence: 'high' | 'medium' | 'low';
    /**
     * Human-readable tokens that drove the classification, useful for
     * debugging UI ("detected as a question because it starts with
     * 'How'") and telemetry.
     */
    signals: string[];
}

// ---------------------------------------------------------------------------
// Marker tables — small, legible, easy to extend.
// ---------------------------------------------------------------------------

/** WH / aux starters that overwhelmingly indicate a question. */
const QUESTION_STARTERS = [
    'what',
    'how',
    'why',
    'when',
    'where',
    'who',
    'which',
    'is',
    'are',
    'does',
    'do',
    'can',
    'should',
    'would',
    'could',
    'will',
];

/** Words / phrases that signal "I need to do this in a near-term window". */
const ACTION_MARKERS = [
    'today',
    'right now',
    'tonight',
    'this morning',
    'this afternoon',
    'this evening',
    'this week',
    'tomorrow',
    'this weekend',
];

/** Curiosity / exploration vocabulary. */
const EXPLORATION_MARKERS = [
    'curious',
    'interested in',
    'interested by',
    'been reading',
    'been thinking',
    'been exploring',
    'exploring',
    'wondering',
    'noticing',
    'looking into',
    'poking at',
    'lately',
];

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

/**
 * Classify the altitude of a learner-typed intent string.
 *
 * Pure function. The same input always produces the same output, so
 * two onboardings with identical prompts stamp identical altitudes —
 * which is what we want for any downstream ranking that depends on it.
 */
export const classifyAltitude = (text: string): AltitudeClassification => {
    const trimmed = text.trim();

    if (!trimmed) {
        return {
            altitude: 'aspiration',
            confidence: 'low',
            signals: ['empty input → aspiration default'],
        };
    }

    const lower = trimmed.toLowerCase();
    const signals: string[] = [];

    // 1. Question — highest precedence.
    const endsWithQuestionMark = /\?\s*$/.test(trimmed);
    const firstWord = lower.split(/\s+/)[0] ?? '';
    const startsWithQuestionWord = QUESTION_STARTERS.includes(firstWord);

    if (endsWithQuestionMark || startsWithQuestionWord) {
        if (endsWithQuestionMark) signals.push('ends with "?"');

        if (startsWithQuestionWord) {
            signals.push(`starts with "${firstWord}"`);
        }

        // High confidence when both signals fire, medium when only
        // one does. A terminal "?" alone is plenty to be confident;
        // a WH-starter alone can occasionally be declarative ("How
        // exciting!" — rare in this input space but possible), so
        // the combined read is cleaner.
        const confidence =
            endsWithQuestionMark && startsWithQuestionWord ? 'high' : 'medium';

        return { altitude: 'question', confidence, signals };
    }

    // 2. Action — immediacy markers.
    for (const marker of ACTION_MARKERS) {
        if (lower.includes(marker)) {
            signals.push(`contains "${marker}"`);

            return { altitude: 'action', confidence: 'high', signals };
        }
    }

    // 3. Exploration — curiosity vocabulary.
    for (const marker of EXPLORATION_MARKERS) {
        if (lower.includes(marker)) {
            signals.push(`contains "${marker}"`);

            return { altitude: 'exploration', confidence: 'high', signals };
        }
    }

    // 4. Aspiration — default. We still emit a light signal so the
    //    telemetry can distinguish "defaulted because nothing matched"
    //    from "classifier confident it's an aspiration".
    signals.push('no stronger altitude signal → aspiration default');

    return { altitude: 'aspiration', confidence: 'medium', signals };
};
