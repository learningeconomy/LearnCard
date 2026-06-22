/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrasetooshort2Inputs */

const en_recovery_phrasetooshort2 = /** @type {(inputs: Recovery_Phrasetooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter all 25 words of your recovery phrase.`)
};

const es_recovery_phrasetooshort2 = /** @type {(inputs: Recovery_Phrasetooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa las 25 palabras de tu frase de recuperación.`)
};

const fr_recovery_phrasetooshort2 = /** @type {(inputs: Recovery_Phrasetooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer les 25 mots de votre phrase de récupération.`)
};

const ar_recovery_phrasetooshort2 = /** @type {(inputs: Recovery_Phrasetooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال جميع الكلمات الخمس والعشرين لعبارة الاسترداد.`)
};

/**
* | output |
* | --- |
* | "Please enter all 25 words of your recovery phrase." |
*
* @param {Recovery_Phrasetooshort2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrasetooshort2 = /** @type {((inputs?: Recovery_Phrasetooshort2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrasetooshort2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrasetooshort2(inputs)
	if (locale === "es") return es_recovery_phrasetooshort2(inputs)
	if (locale === "fr") return fr_recovery_phrasetooshort2(inputs)
	return ar_recovery_phrasetooshort2(inputs)
});
export { recovery_phrasetooshort2 as "recovery.phraseTooShort" }