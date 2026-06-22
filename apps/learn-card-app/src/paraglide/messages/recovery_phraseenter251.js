/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phraseenter251Inputs */

const en_recovery_phraseenter251 = /** @type {(inputs: Recovery_Phraseenter251Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your 25-word phrase`)
};

const es_recovery_phraseenter251 = /** @type {(inputs: Recovery_Phraseenter251Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa tu frase de 25 palabras`)
};

const fr_recovery_phraseenter251 = /** @type {(inputs: Recovery_Phraseenter251Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entrez votre phrase de 25 mots`)
};

const ar_recovery_phraseenter251 = /** @type {(inputs: Recovery_Phraseenter251Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل عبارة من 25 كلمة`)
};

/**
* | output |
* | --- |
* | "Enter your 25-word phrase" |
*
* @param {Recovery_Phraseenter251Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phraseenter251 = /** @type {((inputs?: Recovery_Phraseenter251Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phraseenter251Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phraseenter251(inputs)
	if (locale === "es") return es_recovery_phraseenter251(inputs)
	if (locale === "fr") return fr_recovery_phraseenter251(inputs)
	return ar_recovery_phraseenter251(inputs)
});
export { recovery_phraseenter251 as "recovery.phraseEnter25" }