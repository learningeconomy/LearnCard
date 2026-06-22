/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Boost_Search_Searchearned1Inputs */

const en_boost_search_searchearned1 = /** @type {(inputs: Boost_Search_Searchearned1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Search ${i?.count} earned Boost(s)`)
};

const es_boost_search_searchearned1 = /** @type {(inputs: Boost_Search_Searchearned1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buscar ${i?.count} Boost(s) obtenido(s)`)
};

const fr_boost_search_searchearned1 = /** @type {(inputs: Boost_Search_Searchearned1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rechercher ${i?.count} Boost(s) obtenu(s)`)
};

const ar_boost_search_searchearned1 = /** @type {(inputs: Boost_Search_Searchearned1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`البحث في ${i?.count} Boost المكتسبة`)
};

/**
* | output |
* | --- |
* | "Search {count} earned Boost(s)" |
*
* @param {Boost_Search_Searchearned1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_search_searchearned1 = /** @type {((inputs: Boost_Search_Searchearned1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Search_Searchearned1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_search_searchearned1(inputs)
	if (locale === "es") return es_boost_search_searchearned1(inputs)
	if (locale === "fr") return fr_boost_search_searchearned1(inputs)
	return ar_boost_search_searchearned1(inputs)
});
export { boost_search_searchearned1 as "boost.search.searchEarned" }