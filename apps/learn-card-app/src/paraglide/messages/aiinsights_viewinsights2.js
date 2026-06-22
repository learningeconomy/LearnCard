/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Viewinsights2Inputs */

const en_aiinsights_viewinsights2 = /** @type {(inputs: Aiinsights_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Insights`)
};

const es_aiinsights_viewinsights2 = /** @type {(inputs: Aiinsights_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Insights`)
};

const fr_aiinsights_viewinsights2 = /** @type {(inputs: Aiinsights_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les Insights`)
};

const ar_aiinsights_viewinsights2 = /** @type {(inputs: Aiinsights_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الرؤى`)
};

/**
* | output |
* | --- |
* | "View Insights" |
*
* @param {Aiinsights_Viewinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_viewinsights2 = /** @type {((inputs?: Aiinsights_Viewinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Viewinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_viewinsights2(inputs)
	if (locale === "es") return es_aiinsights_viewinsights2(inputs)
	if (locale === "fr") return fr_aiinsights_viewinsights2(inputs)
	return ar_aiinsights_viewinsights2(inputs)
});
export { aiinsights_viewinsights2 as "aiInsights.viewInsights" }