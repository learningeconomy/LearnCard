/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Generateaiinsights3Inputs */

const en_aiinsights_generateaiinsights3 = /** @type {(inputs: Aiinsights_Generateaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Insights`)
};

const es_aiinsights_generateaiinsights3 = /** @type {(inputs: Aiinsights_Generateaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar Insights`)
};

const fr_aiinsights_generateaiinsights3 = /** @type {(inputs: Aiinsights_Generateaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer des Insights`)
};

const ar_aiinsights_generateaiinsights3 = /** @type {(inputs: Aiinsights_Generateaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء الرؤى`)
};

/**
* | output |
* | --- |
* | "Generate Insights" |
*
* @param {Aiinsights_Generateaiinsights3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_generateaiinsights3 = /** @type {((inputs?: Aiinsights_Generateaiinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Generateaiinsights3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_generateaiinsights3(inputs)
	if (locale === "es") return es_aiinsights_generateaiinsights3(inputs)
	if (locale === "fr") return fr_aiinsights_generateaiinsights3(inputs)
	return ar_aiinsights_generateaiinsights3(inputs)
});
export { aiinsights_generateaiinsights3 as "aiInsights.generateAiInsights" }