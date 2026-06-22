/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Boost_Cms_Issueto_Searchnetwork2Inputs */

const en_boost_cms_issueto_searchnetwork2 = /** @type {(inputs: Boost_Cms_Issueto_Searchnetwork2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Search ${i?.name} Network...`)
};

const es_boost_cms_issueto_searchnetwork2 = /** @type {(inputs: Boost_Cms_Issueto_Searchnetwork2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buscar en la red de ${i?.name}...`)
};

const fr_boost_cms_issueto_searchnetwork2 = /** @type {(inputs: Boost_Cms_Issueto_Searchnetwork2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rechercher dans le réseau ${i?.name}...`)
};

const ar_boost_cms_issueto_searchnetwork2 = /** @type {(inputs: Boost_Cms_Issueto_Searchnetwork2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`بحث في شبكة ${i?.name}...`)
};

/**
* | output |
* | --- |
* | "Search {name} Network..." |
*
* @param {Boost_Cms_Issueto_Searchnetwork2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_searchnetwork2 = /** @type {((inputs: Boost_Cms_Issueto_Searchnetwork2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Searchnetwork2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_searchnetwork2(inputs)
	if (locale === "es") return es_boost_cms_issueto_searchnetwork2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_searchnetwork2(inputs)
	return ar_boost_cms_issueto_searchnetwork2(inputs)
});
export { boost_cms_issueto_searchnetwork2 as "boost.cms.issueTo.searchNetwork" }