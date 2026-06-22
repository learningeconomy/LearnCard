/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, query: NonNullable<unknown> }} Boost_Search_Foundresults1Inputs */

const en_boost_search_foundresults1 = /** @type {(inputs: Boost_Search_Foundresults1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Found ${i?.count} result(s) for "${i?.query}"`)
};

const es_boost_search_foundresults1 = /** @type {(inputs: Boost_Search_Foundresults1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Se encontraron ${i?.count} resultado(s) para "${i?.query}"`)
};

const fr_boost_search_foundresults1 = /** @type {(inputs: Boost_Search_Foundresults1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} résultat(s) trouvé(s) pour « ${i?.query} »`)
};

const ar_boost_search_foundresults1 = /** @type {(inputs: Boost_Search_Foundresults1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم العثور على ${i?.count} نتيجة لـ "${i?.query}"`)
};

/**
* | output |
* | --- |
* | "Found {count} result(s) for \"{query}\"" |
*
* @param {Boost_Search_Foundresults1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_search_foundresults1 = /** @type {((inputs: Boost_Search_Foundresults1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Search_Foundresults1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_search_foundresults1(inputs)
	if (locale === "es") return es_boost_search_foundresults1(inputs)
	if (locale === "fr") return fr_boost_search_foundresults1(inputs)
	return ar_boost_search_foundresults1(inputs)
});
export { boost_search_foundresults1 as "boost.search.foundResults" }