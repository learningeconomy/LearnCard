/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Insightslabel2Inputs */

const en_aiinsights_insightslabel2 = /** @type {(inputs: Aiinsights_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const es_aiinsights_insightslabel2 = /** @type {(inputs: Aiinsights_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const fr_aiinsights_insightslabel2 = /** @type {(inputs: Aiinsights_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const ar_aiinsights_insightslabel2 = /** @type {(inputs: Aiinsights_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرؤى`)
};

/**
* | output |
* | --- |
* | "Insights" |
*
* @param {Aiinsights_Insightslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_insightslabel2 = /** @type {((inputs?: Aiinsights_Insightslabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Insightslabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_insightslabel2(inputs)
	if (locale === "es") return es_aiinsights_insightslabel2(inputs)
	if (locale === "fr") return fr_aiinsights_insightslabel2(inputs)
	return ar_aiinsights_insightslabel2(inputs)
});
export { aiinsights_insightslabel2 as "aiInsights.insightsLabel" }