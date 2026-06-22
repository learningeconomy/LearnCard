/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Searchresults2Inputs */

const en_aiinsights_searchresults2 = /** @type {(inputs: Aiinsights_Searchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search Results`)
};

const es_aiinsights_searchresults2 = /** @type {(inputs: Aiinsights_Searchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultados de búsqueda`)
};

const fr_aiinsights_searchresults2 = /** @type {(inputs: Aiinsights_Searchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultats de recherche`)
};

const ar_aiinsights_searchresults2 = /** @type {(inputs: Aiinsights_Searchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نتائج البحث`)
};

/**
* | output |
* | --- |
* | "Search Results" |
*
* @param {Aiinsights_Searchresults2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_searchresults2 = /** @type {((inputs?: Aiinsights_Searchresults2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Searchresults2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_searchresults2(inputs)
	if (locale === "es") return es_aiinsights_searchresults2(inputs)
	if (locale === "fr") return fr_aiinsights_searchresults2(inputs)
	return ar_aiinsights_searchresults2(inputs)
});
export { aiinsights_searchresults2 as "aiInsights.searchResults" }