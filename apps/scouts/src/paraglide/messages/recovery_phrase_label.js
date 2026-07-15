/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrase_LabelInputs */

const en_recovery_phrase_label = /** @type {(inputs: Recovery_Phrase_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your phrase`)
};

const es_recovery_phrase_label = /** @type {(inputs: Recovery_Phrase_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu frase`)
};

const fr_recovery_phrase_label = /** @type {(inputs: Recovery_Phrase_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre phrase`)
};

const ar_recovery_phrase_label = /** @type {(inputs: Recovery_Phrase_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your phrase`)
};

/**
* | output |
* | --- |
* | "Your phrase" |
*
* @param {Recovery_Phrase_LabelInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrase_label = /** @type {((inputs?: Recovery_Phrase_LabelInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrase_LabelInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrase_label(inputs)
	if (locale === "es") return es_recovery_phrase_label(inputs)
	if (locale === "fr") return fr_recovery_phrase_label(inputs)
	return ar_recovery_phrase_label(inputs)
});
export { recovery_phrase_label as "recovery.phrase.label" }