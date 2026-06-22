/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ query: NonNullable<unknown> }} Boost_Search_Noresultstitled2Inputs */

const en_boost_search_noresultstitled2 = /** @type {(inputs: Boost_Search_Noresultstitled2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`No results titled "${i?.query}"`)
};

const es_boost_search_noresultstitled2 = /** @type {(inputs: Boost_Search_Noresultstitled2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`No hay resultados titulados "${i?.query}"`)
};

const fr_boost_search_noresultstitled2 = /** @type {(inputs: Boost_Search_Noresultstitled2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aucun résultat intitulé « ${i?.query} »`)
};

const ar_boost_search_noresultstitled2 = /** @type {(inputs: Boost_Search_Noresultstitled2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج بعنوان "${i?.query}"`)
};

/**
* | output |
* | --- |
* | "No results titled \"{query}\"" |
*
* @param {Boost_Search_Noresultstitled2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_search_noresultstitled2 = /** @type {((inputs: Boost_Search_Noresultstitled2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Search_Noresultstitled2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_search_noresultstitled2(inputs)
	if (locale === "es") return es_boost_search_noresultstitled2(inputs)
	if (locale === "fr") return fr_boost_search_noresultstitled2(inputs)
	return ar_boost_search_noresultstitled2(inputs)
});
export { boost_search_noresultstitled2 as "boost.search.noResultsTitled" }