/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrase_PlaceholderInputs */

const en_recovery_phrase_placeholder = /** @type {(inputs: Recovery_Phrase_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`word1 word2 word3 ...`)
};

const es_recovery_phrase_placeholder = /** @type {(inputs: Recovery_Phrase_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`palabra1 palabra2 palabra3 ...`)
};

const fr_recovery_phrase_placeholder = /** @type {(inputs: Recovery_Phrase_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`mot1 mot2 mot3 ...`)
};

const ar_recovery_phrase_placeholder = /** @type {(inputs: Recovery_Phrase_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`word1 word2 word3 ...`)
};

/**
* | output |
* | --- |
* | "word1 word2 word3 ..." |
*
* @param {Recovery_Phrase_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrase_placeholder = /** @type {((inputs?: Recovery_Phrase_PlaceholderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrase_PlaceholderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrase_placeholder(inputs)
	if (locale === "es") return es_recovery_phrase_placeholder(inputs)
	if (locale === "fr") return fr_recovery_phrase_placeholder(inputs)
	return ar_recovery_phrase_placeholder(inputs)
});
export { recovery_phrase_placeholder as "recovery.phrase.placeholder" }