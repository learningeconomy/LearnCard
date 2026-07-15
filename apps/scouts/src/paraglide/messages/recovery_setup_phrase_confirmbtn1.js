/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Confirmbtn1Inputs */

const en_recovery_setup_phrase_confirmbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Confirmbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I've Saved It Somewhere Safe`)
};

const es_recovery_setup_phrase_confirmbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Confirmbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lo He Guardado en un Lugar Seguro`)
};

const fr_recovery_setup_phrase_confirmbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Confirmbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je l'ai sauvegardée dans un endroit sûr`)
};

const ar_recovery_setup_phrase_confirmbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Confirmbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد حفظتها في مكان آمن`)
};

/**
* | output |
* | --- |
* | "I've Saved It Somewhere Safe" |
*
* @param {Recovery_Setup_Phrase_Confirmbtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_confirmbtn1 = /** @type {((inputs?: Recovery_Setup_Phrase_Confirmbtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Confirmbtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_confirmbtn1(inputs)
	if (locale === "es") return es_recovery_setup_phrase_confirmbtn1(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_confirmbtn1(inputs)
	return ar_recovery_setup_phrase_confirmbtn1(inputs)
});
export { recovery_setup_phrase_confirmbtn1 as "recovery.setup.phrase.confirmBtn" }