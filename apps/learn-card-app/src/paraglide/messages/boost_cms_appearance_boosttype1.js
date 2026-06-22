/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Boosttype1Inputs */

const en_boost_cms_appearance_boosttype1 = /** @type {(inputs: Boost_Cms_Appearance_Boosttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Type`)
};

const es_boost_cms_appearance_boosttype1 = /** @type {(inputs: Boost_Cms_Appearance_Boosttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de boost`)
};

const fr_boost_cms_appearance_boosttype1 = /** @type {(inputs: Boost_Cms_Appearance_Boosttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de boost`)
};

const ar_boost_cms_appearance_boosttype1 = /** @type {(inputs: Boost_Cms_Appearance_Boosttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع البوست`)
};

/**
* | output |
* | --- |
* | "Boost Type" |
*
* @param {Boost_Cms_Appearance_Boosttype1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_boosttype1 = /** @type {((inputs?: Boost_Cms_Appearance_Boosttype1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Boosttype1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_boosttype1(inputs)
	if (locale === "es") return es_boost_cms_appearance_boosttype1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_boosttype1(inputs)
	return ar_boost_cms_appearance_boosttype1(inputs)
});
export { boost_cms_appearance_boosttype1 as "boost.cms.appearance.boostType" }