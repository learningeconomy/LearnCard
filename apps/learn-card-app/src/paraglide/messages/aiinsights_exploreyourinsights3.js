/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Exploreyourinsights3Inputs */

const en_aiinsights_exploreyourinsights3 = /** @type {(inputs: Aiinsights_Exploreyourinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore Your Insights`)
};

const es_aiinsights_exploreyourinsights3 = /** @type {(inputs: Aiinsights_Exploreyourinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explora tus Insights`)
};

const fr_aiinsights_exploreyourinsights3 = /** @type {(inputs: Aiinsights_Exploreyourinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorez vos Insights`)
};

const ar_aiinsights_exploreyourinsights3 = /** @type {(inputs: Aiinsights_Exploreyourinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشف رؤاك`)
};

/**
* | output |
* | --- |
* | "Explore Your Insights" |
*
* @param {Aiinsights_Exploreyourinsights3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_exploreyourinsights3 = /** @type {((inputs?: Aiinsights_Exploreyourinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Exploreyourinsights3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_exploreyourinsights3(inputs)
	if (locale === "es") return es_aiinsights_exploreyourinsights3(inputs)
	if (locale === "fr") return fr_aiinsights_exploreyourinsights3(inputs)
	return ar_aiinsights_exploreyourinsights3(inputs)
});
export { aiinsights_exploreyourinsights3 as "aiInsights.exploreYourInsights" }