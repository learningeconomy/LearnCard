/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Recovery_Phrase_Wordcount1Inputs */

const en_recovery_phrase_wordcount1 = /** @type {(inputs: Recovery_Phrase_Wordcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 words`)
};

const es_recovery_phrase_wordcount1 = /** @type {(inputs: Recovery_Phrase_Wordcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 palabras`)
};

const fr_recovery_phrase_wordcount1 = /** @type {(inputs: Recovery_Phrase_Wordcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 mots`)
};

const ar_recovery_phrase_wordcount1 = /** @type {(inputs: Recovery_Phrase_Wordcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 words`)
};

/**
* | output |
* | --- |
* | "{count} / 25 words" |
*
* @param {Recovery_Phrase_Wordcount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrase_wordcount1 = /** @type {((inputs: Recovery_Phrase_Wordcount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrase_Wordcount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrase_wordcount1(inputs)
	if (locale === "es") return es_recovery_phrase_wordcount1(inputs)
	if (locale === "fr") return fr_recovery_phrase_wordcount1(inputs)
	return ar_recovery_phrase_wordcount1(inputs)
});
export { recovery_phrase_wordcount1 as "recovery.phrase.wordCount" }