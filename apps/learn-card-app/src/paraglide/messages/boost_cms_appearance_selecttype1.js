/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Selecttype1Inputs */

const en_boost_cms_appearance_selecttype1 = /** @type {(inputs: Boost_Cms_Appearance_Selecttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Type`)
};

const es_boost_cms_appearance_selecttype1 = /** @type {(inputs: Boost_Cms_Appearance_Selecttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar tipo`)
};

const fr_boost_cms_appearance_selecttype1 = /** @type {(inputs: Boost_Cms_Appearance_Selecttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le type`)
};

const ar_boost_cms_appearance_selecttype1 = /** @type {(inputs: Boost_Cms_Appearance_Selecttype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديد النوع`)
};

/**
* | output |
* | --- |
* | "Select Type" |
*
* @param {Boost_Cms_Appearance_Selecttype1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_selecttype1 = /** @type {((inputs?: Boost_Cms_Appearance_Selecttype1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Selecttype1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_selecttype1(inputs)
	if (locale === "es") return es_boost_cms_appearance_selecttype1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_selecttype1(inputs)
	return ar_boost_cms_appearance_selecttype1(inputs)
});
export { boost_cms_appearance_selecttype1 as "boost.cms.appearance.selectType" }