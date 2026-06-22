/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Colorhexcode2Inputs */

const en_boost_cms_appearance_colorhexcode2 = /** @type {(inputs: Boost_Cms_Appearance_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color Hex Code`)
};

const es_boost_cms_appearance_colorhexcode2 = /** @type {(inputs: Boost_Cms_Appearance_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código hexadecimal del color`)
};

const fr_boost_cms_appearance_colorhexcode2 = /** @type {(inputs: Boost_Cms_Appearance_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code hexadécimal de la couleur`)
};

const ar_boost_cms_appearance_colorhexcode2 = /** @type {(inputs: Boost_Cms_Appearance_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كود اللون الست عشري`)
};

/**
* | output |
* | --- |
* | "Color Hex Code" |
*
* @param {Boost_Cms_Appearance_Colorhexcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_colorhexcode2 = /** @type {((inputs?: Boost_Cms_Appearance_Colorhexcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Colorhexcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_colorhexcode2(inputs)
	if (locale === "es") return es_boost_cms_appearance_colorhexcode2(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_colorhexcode2(inputs)
	return ar_boost_cms_appearance_colorhexcode2(inputs)
});
export { boost_cms_appearance_colorhexcode2 as "boost.cms.appearance.colorHexCode" }