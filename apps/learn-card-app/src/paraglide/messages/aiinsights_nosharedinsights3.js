/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Nosharedinsights3Inputs */

const en_aiinsights_nosharedinsights3 = /** @type {(inputs: Aiinsights_Nosharedinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Shared Insights`)
};

const es_aiinsights_nosharedinsights3 = /** @type {(inputs: Aiinsights_Nosharedinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin Insights compartidos`)
};

const fr_aiinsights_nosharedinsights3 = /** @type {(inputs: Aiinsights_Nosharedinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun Insight partagé`)
};

const ar_aiinsights_nosharedinsights3 = /** @type {(inputs: Aiinsights_Nosharedinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد رؤى مشتركة`)
};

/**
* | output |
* | --- |
* | "No Shared Insights" |
*
* @param {Aiinsights_Nosharedinsights3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_nosharedinsights3 = /** @type {((inputs?: Aiinsights_Nosharedinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Nosharedinsights3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_nosharedinsights3(inputs)
	if (locale === "es") return es_aiinsights_nosharedinsights3(inputs)
	if (locale === "fr") return fr_aiinsights_nosharedinsights3(inputs)
	return ar_aiinsights_nosharedinsights3(inputs)
});
export { aiinsights_nosharedinsights3 as "aiInsights.noSharedInsights" }