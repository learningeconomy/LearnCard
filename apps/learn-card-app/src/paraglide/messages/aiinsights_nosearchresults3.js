/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Nosearchresults3Inputs */

const en_aiinsights_nosearchresults3 = /** @type {(inputs: Aiinsights_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Search Results`)
};

const es_aiinsights_nosearchresults3 = /** @type {(inputs: Aiinsights_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados de búsqueda`)
};

const fr_aiinsights_nosearchresults3 = /** @type {(inputs: Aiinsights_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat de recherche`)
};

const ar_aiinsights_nosearchresults3 = /** @type {(inputs: Aiinsights_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج بحث`)
};

/**
* | output |
* | --- |
* | "No Search Results" |
*
* @param {Aiinsights_Nosearchresults3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_nosearchresults3 = /** @type {((inputs?: Aiinsights_Nosearchresults3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Nosearchresults3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_nosearchresults3(inputs)
	if (locale === "es") return es_aiinsights_nosearchresults3(inputs)
	if (locale === "fr") return fr_aiinsights_nosearchresults3(inputs)
	return ar_aiinsights_nosearchresults3(inputs)
});
export { aiinsights_nosearchresults3 as "aiInsights.noSearchResults" }