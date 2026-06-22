/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Searchresults_Noresults2Inputs */

const en_common_searchresults_noresults2 = /** @type {(inputs: Common_Searchresults_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results found`)
};

const es_common_searchresults_noresults2 = /** @type {(inputs: Common_Searchresults_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron resultados`)
};

const fr_common_searchresults_noresults2 = /** @type {(inputs: Common_Searchresults_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat trouvé`)
};

const ar_common_searchresults_noresults2 = /** @type {(inputs: Common_Searchresults_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على نتائج`)
};

/**
* | output |
* | --- |
* | "No results found" |
*
* @param {Common_Searchresults_Noresults2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_searchresults_noresults2 = /** @type {((inputs?: Common_Searchresults_Noresults2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Searchresults_Noresults2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_searchresults_noresults2(inputs)
	if (locale === "es") return es_common_searchresults_noresults2(inputs)
	if (locale === "fr") return fr_common_searchresults_noresults2(inputs)
	return ar_common_searchresults_noresults2(inputs)
});
export { common_searchresults_noresults2 as "common.searchResults.noResults" }