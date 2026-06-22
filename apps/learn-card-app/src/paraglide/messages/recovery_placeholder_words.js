/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Placeholder_WordsInputs */

const en_recovery_placeholder_words = /** @type {(inputs: Recovery_Placeholder_WordsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`word1 word2 word3 ...`)
};

const es_recovery_placeholder_words = /** @type {(inputs: Recovery_Placeholder_WordsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`palabra1 palabra2 palabra3 ...`)
};

const fr_recovery_placeholder_words = /** @type {(inputs: Recovery_Placeholder_WordsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`mot1 mot2 mot3 ...`)
};

const ar_recovery_placeholder_words = /** @type {(inputs: Recovery_Placeholder_WordsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة1 كلمة2 كلمة3 ...`)
};

/**
* | output |
* | --- |
* | "word1 word2 word3 ..." |
*
* @param {Recovery_Placeholder_WordsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_placeholder_words = /** @type {((inputs?: Recovery_Placeholder_WordsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Placeholder_WordsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_placeholder_words(inputs)
	if (locale === "es") return es_recovery_placeholder_words(inputs)
	if (locale === "fr") return fr_recovery_placeholder_words(inputs)
	return ar_recovery_placeholder_words(inputs)
});
export { recovery_placeholder_words as "recovery.placeholder.words" }