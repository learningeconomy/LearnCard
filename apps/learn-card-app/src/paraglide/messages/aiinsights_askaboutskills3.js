/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Askaboutskills3Inputs */

const en_aiinsights_askaboutskills3 = /** @type {(inputs: Aiinsights_Askaboutskills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask about your skills...`)
};

const es_aiinsights_askaboutskills3 = /** @type {(inputs: Aiinsights_Askaboutskills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pregunta sobre tus habilidades...`)
};

const fr_aiinsights_askaboutskills3 = /** @type {(inputs: Aiinsights_Askaboutskills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Posez des questions sur vos compétences...`)
};

const ar_aiinsights_askaboutskills3 = /** @type {(inputs: Aiinsights_Askaboutskills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...اسأل عن مهاراتك`)
};

/**
* | output |
* | --- |
* | "Ask about your skills..." |
*
* @param {Aiinsights_Askaboutskills3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_askaboutskills3 = /** @type {((inputs?: Aiinsights_Askaboutskills3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Askaboutskills3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_askaboutskills3(inputs)
	if (locale === "es") return es_aiinsights_askaboutskills3(inputs)
	if (locale === "fr") return fr_aiinsights_askaboutskills3(inputs)
	return ar_aiinsights_askaboutskills3(inputs)
});
export { aiinsights_askaboutskills3 as "aiInsights.askAboutSkills" }