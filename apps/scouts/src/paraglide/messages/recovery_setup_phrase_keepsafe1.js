/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Keepsafe1Inputs */

const en_recovery_setup_phrase_keepsafe1 = /** @type {(inputs: Recovery_Setup_Phrase_Keepsafe1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep it safe`)
};

const es_recovery_setup_phrase_keepsafe1 = /** @type {(inputs: Recovery_Setup_Phrase_Keepsafe1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mantenla segura`)
};

const fr_recovery_setup_phrase_keepsafe1 = /** @type {(inputs: Recovery_Setup_Phrase_Keepsafe1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gardez-la en lieu sûr`)
};

const ar_recovery_setup_phrase_keepsafe1 = /** @type {(inputs: Recovery_Setup_Phrase_Keepsafe1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep it safe`)
};

/**
* | output |
* | --- |
* | "Keep it safe" |
*
* @param {Recovery_Setup_Phrase_Keepsafe1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_keepsafe1 = /** @type {((inputs?: Recovery_Setup_Phrase_Keepsafe1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Keepsafe1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_keepsafe1(inputs)
	if (locale === "es") return es_recovery_setup_phrase_keepsafe1(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_keepsafe1(inputs)
	return ar_recovery_setup_phrase_keepsafe1(inputs)
});
export { recovery_setup_phrase_keepsafe1 as "recovery.setup.phrase.keepSafe" }