/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Backgroundimage1Inputs */

const en_boost_cms_appearance_backgroundimage1 = /** @type {(inputs: Boost_Cms_Appearance_Backgroundimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Background Image`)
};

const es_boost_cms_appearance_backgroundimage1 = /** @type {(inputs: Boost_Cms_Appearance_Backgroundimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de fondo`)
};

const fr_boost_cms_appearance_backgroundimage1 = /** @type {(inputs: Boost_Cms_Appearance_Backgroundimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image de fond`)
};

const ar_boost_cms_appearance_backgroundimage1 = /** @type {(inputs: Boost_Cms_Appearance_Backgroundimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة الخلفية`)
};

/**
* | output |
* | --- |
* | "Background Image" |
*
* @param {Boost_Cms_Appearance_Backgroundimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_backgroundimage1 = /** @type {((inputs?: Boost_Cms_Appearance_Backgroundimage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Backgroundimage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_backgroundimage1(inputs)
	if (locale === "es") return es_boost_cms_appearance_backgroundimage1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_backgroundimage1(inputs)
	return ar_boost_cms_appearance_backgroundimage1(inputs)
});
export { boost_cms_appearance_backgroundimage1 as "boost.cms.appearance.backgroundImage" }