/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_AllInputs */

const en_boost_cms_appearance_all = /** @type {(inputs: Boost_Cms_Appearance_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_boost_cms_appearance_all = /** @type {(inputs: Boost_Cms_Appearance_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos`)
};

const fr_boost_cms_appearance_all = /** @type {(inputs: Boost_Cms_Appearance_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous`)
};

const ar_boost_cms_appearance_all = /** @type {(inputs: Boost_Cms_Appearance_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Boost_Cms_Appearance_AllInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_all = /** @type {((inputs?: Boost_Cms_Appearance_AllInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_AllInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_all(inputs)
	if (locale === "es") return es_boost_cms_appearance_all(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_all(inputs)
	return ar_boost_cms_appearance_all(inputs)
});
export { boost_cms_appearance_all as "boost.cms.appearance.all" }