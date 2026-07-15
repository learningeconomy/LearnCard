/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Errors_Phraseincomplete1Inputs */

const en_recovery_errors_phraseincomplete1 = /** @type {(inputs: Recovery_Errors_Phraseincomplete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter all 25 words of your recovery phrase.`)
};

const es_recovery_errors_phraseincomplete1 = /** @type {(inputs: Recovery_Errors_Phraseincomplete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa las 25 palabras de tu frase de recuperación.`)
};

const fr_recovery_errors_phraseincomplete1 = /** @type {(inputs: Recovery_Errors_Phraseincomplete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir les 25 mots de votre phrase de récupération.`)
};

const ar_recovery_errors_phraseincomplete1 = /** @type {(inputs: Recovery_Errors_Phraseincomplete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال جميع كلمات عبارة الاسترداد الـ 25.`)
};

/**
* | output |
* | --- |
* | "Please enter all 25 words of your recovery phrase." |
*
* @param {Recovery_Errors_Phraseincomplete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_errors_phraseincomplete1 = /** @type {((inputs?: Recovery_Errors_Phraseincomplete1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Errors_Phraseincomplete1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_errors_phraseincomplete1(inputs)
	if (locale === "es") return es_recovery_errors_phraseincomplete1(inputs)
	if (locale === "fr") return fr_recovery_errors_phraseincomplete1(inputs)
	return ar_recovery_errors_phraseincomplete1(inputs)
});
export { recovery_errors_phraseincomplete1 as "recovery.errors.phraseIncomplete" }