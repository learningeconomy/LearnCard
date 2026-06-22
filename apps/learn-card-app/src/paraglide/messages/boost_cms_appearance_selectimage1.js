/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Selectimage1Inputs */

const en_boost_cms_appearance_selectimage1 = /** @type {(inputs: Boost_Cms_Appearance_Selectimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Image`)
};

const es_boost_cms_appearance_selectimage1 = /** @type {(inputs: Boost_Cms_Appearance_Selectimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar imagen`)
};

const fr_boost_cms_appearance_selectimage1 = /** @type {(inputs: Boost_Cms_Appearance_Selectimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner une image`)
};

const ar_boost_cms_appearance_selectimage1 = /** @type {(inputs: Boost_Cms_Appearance_Selectimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار صورة`)
};

/**
* | output |
* | --- |
* | "Select Image" |
*
* @param {Boost_Cms_Appearance_Selectimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_selectimage1 = /** @type {((inputs?: Boost_Cms_Appearance_Selectimage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Selectimage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_selectimage1(inputs)
	if (locale === "es") return es_boost_cms_appearance_selectimage1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_selectimage1(inputs)
	return ar_boost_cms_appearance_selectimage1(inputs)
});
export { boost_cms_appearance_selectimage1 as "boost.cms.appearance.selectImage" }