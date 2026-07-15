/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_GeneratingInputs */

const en_recovery_setup_phrase_generating = /** @type {(inputs: Recovery_Setup_Phrase_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating...`)
};

const es_recovery_setup_phrase_generating = /** @type {(inputs: Recovery_Setup_Phrase_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando...`)
};

const fr_recovery_setup_phrase_generating = /** @type {(inputs: Recovery_Setup_Phrase_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération en cours...`)
};

const ar_recovery_setup_phrase_generating = /** @type {(inputs: Recovery_Setup_Phrase_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Recovery_Setup_Phrase_GeneratingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_generating = /** @type {((inputs?: Recovery_Setup_Phrase_GeneratingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_GeneratingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_generating(inputs)
	if (locale === "es") return es_recovery_setup_phrase_generating(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_generating(inputs)
	return ar_recovery_setup_phrase_generating(inputs)
});
export { recovery_setup_phrase_generating as "recovery.setup.phrase.generating" }