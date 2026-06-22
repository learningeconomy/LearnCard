/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phraseenterdesc2Inputs */

const en_recovery_phraseenterdesc2 = /** @type {(inputs: Recovery_Phraseenterdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your 25-word recovery phrase, separated by spaces.`)
};

const es_recovery_phraseenterdesc2 = /** @type {(inputs: Recovery_Phraseenterdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa tu frase de recuperación de 25 palabras, separadas por espacios.`)
};

const fr_recovery_phraseenterdesc2 = /** @type {(inputs: Recovery_Phraseenterdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entrez votre phrase de récupération de 25 mots, séparées par des espaces.`)
};

const ar_recovery_phraseenterdesc2 = /** @type {(inputs: Recovery_Phraseenterdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل عبارة الاسترداد المكونة من 25 كلمة، مفصولة بمسافات.`)
};

/**
* | output |
* | --- |
* | "Enter your 25-word recovery phrase, separated by spaces." |
*
* @param {Recovery_Phraseenterdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phraseenterdesc2 = /** @type {((inputs?: Recovery_Phraseenterdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phraseenterdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phraseenterdesc2(inputs)
	if (locale === "es") return es_recovery_phraseenterdesc2(inputs)
	if (locale === "fr") return fr_recovery_phraseenterdesc2(inputs)
	return ar_recovery_phraseenterdesc2(inputs)
});
export { recovery_phraseenterdesc2 as "recovery.phraseEnterDesc" }