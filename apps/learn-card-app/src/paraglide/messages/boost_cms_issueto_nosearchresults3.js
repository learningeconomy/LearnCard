/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Nosearchresults3Inputs */

const en_boost_cms_issueto_nosearchresults3 = /** @type {(inputs: Boost_Cms_Issueto_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No search results`)
};

const es_boost_cms_issueto_nosearchresults3 = /** @type {(inputs: Boost_Cms_Issueto_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados de búsqueda`)
};

const fr_boost_cms_issueto_nosearchresults3 = /** @type {(inputs: Boost_Cms_Issueto_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat de recherche`)
};

const ar_boost_cms_issueto_nosearchresults3 = /** @type {(inputs: Boost_Cms_Issueto_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج بحث`)
};

/**
* | output |
* | --- |
* | "No search results" |
*
* @param {Boost_Cms_Issueto_Nosearchresults3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_nosearchresults3 = /** @type {((inputs?: Boost_Cms_Issueto_Nosearchresults3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Nosearchresults3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_nosearchresults3(inputs)
	if (locale === "es") return es_boost_cms_issueto_nosearchresults3(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_nosearchresults3(inputs)
	return ar_boost_cms_issueto_nosearchresults3(inputs)
});
export { boost_cms_issueto_nosearchresults3 as "boost.cms.issueTo.noSearchResults" }