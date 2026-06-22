/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Qualitativefactors2Inputs */

const en_aiinsights_qualitativefactors2 = /** @type {(inputs: Aiinsights_Qualitativefactors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qualitative Factors`)
};

const es_aiinsights_qualitativefactors2 = /** @type {(inputs: Aiinsights_Qualitativefactors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Factores cualitativos`)
};

const fr_aiinsights_qualitativefactors2 = /** @type {(inputs: Aiinsights_Qualitativefactors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Facteurs qualitatifs`)
};

const ar_aiinsights_qualitativefactors2 = /** @type {(inputs: Aiinsights_Qualitativefactors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العوامل النوعية`)
};

/**
* | output |
* | --- |
* | "Qualitative Factors" |
*
* @param {Aiinsights_Qualitativefactors2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_qualitativefactors2 = /** @type {((inputs?: Aiinsights_Qualitativefactors2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Qualitativefactors2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_qualitativefactors2(inputs)
	if (locale === "es") return es_aiinsights_qualitativefactors2(inputs)
	if (locale === "fr") return fr_aiinsights_qualitativefactors2(inputs)
	return ar_aiinsights_qualitativefactors2(inputs)
});
export { aiinsights_qualitativefactors2 as "aiInsights.qualitativeFactors" }