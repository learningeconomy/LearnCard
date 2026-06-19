/**
 * Render-layer i18n helpers for the AI personalization questions.
 *
 * The question text (titles, options, placeholders) lives as static English
 * strings in `personalizedQuestions.helpers.ts`, which is a framework-free
 * `.ts` DATA file. Per the LC-1831 data-file pattern, we MUST NOT import
 * Paraglide into that data file and must not call `m[...]()` at module load.
 * The English strings are also used as stable identifiers when writing the
 * QA credential (`transformPersonalizedAnswersForVC` stores the English title
 * and answer values, and `transformQACredIntoState` matches back by English
 * title), so we translate ONLY at the render layer, keyed by the question's
 * `PersonalizedQuestionEnum`.
 *
 * This mirrors the LEVEL_KEYS / CHECKLIST_TITLE_KEYS pattern elsewhere in the
 * app (see SkillProficiencyBar.tsx, CheckListItem.tsx).
 */
import React from 'react';

import * as m from '../../../paraglide/messages.js';
import { TransP } from '../../../i18n/TransP';
import { PersonalizedQuestionEnum } from '../personalizedQuestions.helpers';

// Exported for `personalizationI18n.test.ts`, which asserts every key here
// resolves to a real Paraglide message. The dynamic `m[key]` lookup below is
// invisible to both i18n CI guards (the build-time onwarn and the static
// check-i18n-keys scanner only see literal `m['…']`), so the test is the
// safety net against a typo here silently rendering nothing.
export const TITLE_KEYS: Record<PersonalizedQuestionEnum, string> = {
    [PersonalizedQuestionEnum.iLearnBest]: 'aiPersonalization.q1.title',
    [PersonalizedQuestionEnum.favFictionalCharacter]: 'aiPersonalization.q2.title',
    [PersonalizedQuestionEnum.favMovieGenre]: 'aiPersonalization.q3.title',
};

// Only Q1 (iLearnBest) has predefined options. Index order matches the data
// file's `predefinedAnswers` array.
export const Q1_OPTION_KEYS = [
    'aiPersonalization.q1.options.o1',
    'aiPersonalization.q1.options.o2',
    'aiPersonalization.q1.options.o3',
    'aiPersonalization.q1.options.o4',
    'aiPersonalization.q1.options.o5',
];

export const PLACEHOLDER_KEYS: Partial<Record<PersonalizedQuestionEnum, string>> = {
    [PersonalizedQuestionEnum.favFictionalCharacter]: 'aiPersonalization.q2.placeholder',
    [PersonalizedQuestionEnum.favMovieGenre]: 'aiPersonalization.q3.placeholder',
};

const tMsg = (key: string | undefined): string => {
    if (!key) return '';
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as () => string)() : '';
};

/**
 * Resolve the translated display text for a predefined option. The English
 * data value remains the stable identifier stored in component state / the VC.
 */
export const getPersonalizedOptionText = (
    questionType: PersonalizedQuestionEnum,
    index: number
): string => {
    if (questionType !== PersonalizedQuestionEnum.iLearnBest) return '';
    return tMsg(Q1_OPTION_KEYS[index]);
};

/**
 * Resolve the translated input placeholder for a question (Q2/Q3 free-text).
 */
export const getPersonalizedPlaceholder = (questionType: PersonalizedQuestionEnum): string => {
    return tMsg(PLACEHOLDER_KEYS[questionType]);
};

/**
 * Render a question title with its emphasized substring translated inline.
 * Uses TransP so the translator controls where the bold (`<0>…</0>`) markup
 * falls, rather than string-matching an English emphasis phrase (which would
 * break once the title is translated).
 */
export const PersonalizationQuestionTitle: React.FC<{
    questionType: PersonalizedQuestionEnum;
}> = ({ questionType }) => {
    const key = TITLE_KEYS[questionType];
    const fn = key ? (m as Record<string, unknown>)[key] : undefined;
    if (typeof fn !== 'function') return null;

    return (
        <TransP
            m={fn as Parameters<typeof TransP>[0]['m']}
            components={[<span className="font-semibold" />]}
        />
    );
};

export default PersonalizationQuestionTitle;
