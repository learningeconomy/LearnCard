/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Nosearchresults2Inputs */

const en_boost_nosearchresults2 = /** @type {(inputs: Boost_Nosearchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No search results`)
};

const es_boost_nosearchresults2 = /** @type {(inputs: Boost_Nosearchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados`)
};

const fr_boost_nosearchresults2 = /** @type {(inputs: Boost_Nosearchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat de recherche`)
};

const ar_boost_nosearchresults2 = /** @type {(inputs: Boost_Nosearchresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No search results`)
};

/**
* | output |
* | --- |
* | "No search results" |
*
* @param {Boost_Nosearchresults2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_nosearchresults2 = /** @type {((inputs?: Boost_Nosearchresults2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Nosearchresults2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_nosearchresults2(inputs)
	if (locale === "es") return es_boost_nosearchresults2(inputs)
	if (locale === "fr") return fr_boost_nosearchresults2(inputs)
	return ar_boost_nosearchresults2(inputs)
});
export { boost_nosearchresults2 as "boost.noSearchResults" }