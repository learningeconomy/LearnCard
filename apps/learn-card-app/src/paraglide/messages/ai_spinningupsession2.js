/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Spinningupsession2Inputs */

const en_ai_spinningupsession2 = /** @type {(inputs: Ai_Spinningupsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spinning up your session...`)
};

const es_ai_spinningupsession2 = /** @type {(inputs: Ai_Spinningupsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparando tu sesión...`)
};

const fr_ai_spinningupsession2 = /** @type {(inputs: Ai_Spinningupsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation de votre session...`)
};

const ar_ai_spinningupsession2 = /** @type {(inputs: Ai_Spinningupsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحضير جلستك...`)
};

/**
* | output |
* | --- |
* | "Spinning up your session..." |
*
* @param {Ai_Spinningupsession2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_spinningupsession2 = /** @type {((inputs?: Ai_Spinningupsession2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Spinningupsession2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_spinningupsession2(inputs)
	if (locale === "es") return es_ai_spinningupsession2(inputs)
	if (locale === "fr") return fr_ai_spinningupsession2(inputs)
	return ar_ai_spinningupsession2(inputs)
});
export { ai_spinningupsession2 as "ai.spinningUpSession" }