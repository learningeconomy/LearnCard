/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Noresultsfor2Inputs */

const en_boost_cms_appearance_noresultsfor2 = /** @type {(inputs: Boost_Cms_Appearance_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results found for`)
};

const es_boost_cms_appearance_noresultsfor2 = /** @type {(inputs: Boost_Cms_Appearance_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron resultados para`)
};

const fr_boost_cms_appearance_noresultsfor2 = /** @type {(inputs: Boost_Cms_Appearance_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat trouvé pour`)
};

const ar_boost_cms_appearance_noresultsfor2 = /** @type {(inputs: Boost_Cms_Appearance_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على نتائج لـ`)
};

/**
* | output |
* | --- |
* | "No results found for" |
*
* @param {Boost_Cms_Appearance_Noresultsfor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_noresultsfor2 = /** @type {((inputs?: Boost_Cms_Appearance_Noresultsfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Noresultsfor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_noresultsfor2(inputs)
	if (locale === "es") return es_boost_cms_appearance_noresultsfor2(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_noresultsfor2(inputs)
	return ar_boost_cms_appearance_noresultsfor2(inputs)
});
export { boost_cms_appearance_noresultsfor2 as "boost.cms.appearance.noResultsFor" }