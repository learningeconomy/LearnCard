/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_SearchInputs */

const en_boost_cms_appearance_search = /** @type {(inputs: Boost_Cms_Appearance_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search...`)
};

const es_boost_cms_appearance_search = /** @type {(inputs: Boost_Cms_Appearance_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar...`)
};

const fr_boost_cms_appearance_search = /** @type {(inputs: Boost_Cms_Appearance_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher...`)
};

const ar_boost_cms_appearance_search = /** @type {(inputs: Boost_Cms_Appearance_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحث...`)
};

/**
* | output |
* | --- |
* | "Search..." |
*
* @param {Boost_Cms_Appearance_SearchInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_search = /** @type {((inputs?: Boost_Cms_Appearance_SearchInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_SearchInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_search(inputs)
	if (locale === "es") return es_boost_cms_appearance_search(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_search(inputs)
	return ar_boost_cms_appearance_search(inputs)
});
export { boost_cms_appearance_search as "boost.cms.appearance.search" }