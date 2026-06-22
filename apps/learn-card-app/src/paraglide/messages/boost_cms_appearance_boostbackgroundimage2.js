/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Boostbackgroundimage2Inputs */

const en_boost_cms_appearance_boostbackgroundimage2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Background Image`)
};

const es_boost_cms_appearance_boostbackgroundimage2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de fondo del boost`)
};

const fr_boost_cms_appearance_boostbackgroundimage2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image de fond du boost`)
};

const ar_boost_cms_appearance_boostbackgroundimage2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة خلفية البوست`)
};

/**
* | output |
* | --- |
* | "Boost Background Image" |
*
* @param {Boost_Cms_Appearance_Boostbackgroundimage2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_boostbackgroundimage2 = /** @type {((inputs?: Boost_Cms_Appearance_Boostbackgroundimage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Boostbackgroundimage2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_boostbackgroundimage2(inputs)
	if (locale === "es") return es_boost_cms_appearance_boostbackgroundimage2(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_boostbackgroundimage2(inputs)
	return ar_boost_cms_appearance_boostbackgroundimage2(inputs)
});
export { boost_cms_appearance_boostbackgroundimage2 as "boost.cms.appearance.boostBackgroundImage" }