/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Copybtn1Inputs */

const en_recovery_setup_phrase_copybtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Copybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy to Clipboard`)
};

const es_recovery_setup_phrase_copybtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Copybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar al Portapapeles`)
};

const fr_recovery_setup_phrase_copybtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Copybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier dans le presse-papiers`)
};

const ar_recovery_setup_phrase_copybtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Copybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy to Clipboard`)
};

/**
* | output |
* | --- |
* | "Copy to Clipboard" |
*
* @param {Recovery_Setup_Phrase_Copybtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_copybtn1 = /** @type {((inputs?: Recovery_Setup_Phrase_Copybtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Copybtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_copybtn1(inputs)
	if (locale === "es") return es_recovery_setup_phrase_copybtn1(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_copybtn1(inputs)
	return ar_recovery_setup_phrase_copybtn1(inputs)
});
export { recovery_setup_phrase_copybtn1 as "recovery.setup.phrase.copyBtn" }