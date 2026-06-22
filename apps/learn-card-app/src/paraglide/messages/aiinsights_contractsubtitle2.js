/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Contractsubtitle2Inputs */

const en_aiinsights_contractsubtitle2 = /** @type {(inputs: Aiinsights_Contractsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share learning progress with your teacher`)
};

const es_aiinsights_contractsubtitle2 = /** @type {(inputs: Aiinsights_Contractsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte tu progreso de aprendizaje con tu profesor`)
};

const fr_aiinsights_contractsubtitle2 = /** @type {(inputs: Aiinsights_Contractsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez votre progression avec votre enseignant`)
};

const ar_aiinsights_contractsubtitle2 = /** @type {(inputs: Aiinsights_Contractsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك تقدمك التعليمي مع معلمك`)
};

/**
* | output |
* | --- |
* | "Share learning progress with your teacher" |
*
* @param {Aiinsights_Contractsubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_contractsubtitle2 = /** @type {((inputs?: Aiinsights_Contractsubtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Contractsubtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_contractsubtitle2(inputs)
	if (locale === "es") return es_aiinsights_contractsubtitle2(inputs)
	if (locale === "fr") return fr_aiinsights_contractsubtitle2(inputs)
	return ar_aiinsights_contractsubtitle2(inputs)
});
export { aiinsights_contractsubtitle2 as "aiInsights.contractSubtitle" }