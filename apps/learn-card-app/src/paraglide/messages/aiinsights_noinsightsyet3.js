/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Noinsightsyet3Inputs */

const en_aiinsights_noinsightsyet3 = /** @type {(inputs: Aiinsights_Noinsightsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Insights yet.`)
};

const es_aiinsights_noinsightsyet3 = /** @type {(inputs: Aiinsights_Noinsightsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay Insights.`)
};

const fr_aiinsights_noinsightsyet3 = /** @type {(inputs: Aiinsights_Noinsightsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore d'Insights.`)
};

const ar_aiinsights_noinsightsyet3 = /** @type {(inputs: Aiinsights_Noinsightsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد رؤى بعد.`)
};

/**
* | output |
* | --- |
* | "No Insights yet." |
*
* @param {Aiinsights_Noinsightsyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_noinsightsyet3 = /** @type {((inputs?: Aiinsights_Noinsightsyet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Noinsightsyet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_noinsightsyet3(inputs)
	if (locale === "es") return es_aiinsights_noinsightsyet3(inputs)
	if (locale === "fr") return fr_aiinsights_noinsightsyet3(inputs)
	return ar_aiinsights_noinsightsyet3(inputs)
});
export { aiinsights_noinsightsyet3 as "aiInsights.noInsightsYet" }