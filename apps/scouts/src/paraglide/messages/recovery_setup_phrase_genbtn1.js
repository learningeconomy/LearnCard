/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Genbtn1Inputs */

const en_recovery_setup_phrase_genbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Genbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Recovery Phrase`)
};

const es_recovery_setup_phrase_genbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Genbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar Frase de Recuperación`)
};

const fr_recovery_setup_phrase_genbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Genbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer la phrase de récupération`)
};

const ar_recovery_setup_phrase_genbtn1 = /** @type {(inputs: Recovery_Setup_Phrase_Genbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Recovery Phrase`)
};

/**
* | output |
* | --- |
* | "Generate Recovery Phrase" |
*
* @param {Recovery_Setup_Phrase_Genbtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_genbtn1 = /** @type {((inputs?: Recovery_Setup_Phrase_Genbtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Genbtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_genbtn1(inputs)
	if (locale === "es") return es_recovery_setup_phrase_genbtn1(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_genbtn1(inputs)
	return ar_recovery_setup_phrase_genbtn1(inputs)
});
export { recovery_setup_phrase_genbtn1 as "recovery.setup.phrase.genBtn" }