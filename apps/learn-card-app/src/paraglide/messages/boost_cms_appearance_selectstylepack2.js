/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Selectstylepack2Inputs */

const en_boost_cms_appearance_selectstylepack2 = /** @type {(inputs: Boost_Cms_Appearance_Selectstylepack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Style Pack`)
};

const es_boost_cms_appearance_selectstylepack2 = /** @type {(inputs: Boost_Cms_Appearance_Selectstylepack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar paquete de estilos`)
};

const fr_boost_cms_appearance_selectstylepack2 = /** @type {(inputs: Boost_Cms_Appearance_Selectstylepack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le pack de styles`)
};

const ar_boost_cms_appearance_selectstylepack2 = /** @type {(inputs: Boost_Cms_Appearance_Selectstylepack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار حزمة الأنماط`)
};

/**
* | output |
* | --- |
* | "Select Style Pack" |
*
* @param {Boost_Cms_Appearance_Selectstylepack2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_selectstylepack2 = /** @type {((inputs?: Boost_Cms_Appearance_Selectstylepack2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Selectstylepack2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_selectstylepack2(inputs)
	if (locale === "es") return es_boost_cms_appearance_selectstylepack2(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_selectstylepack2(inputs)
	return ar_boost_cms_appearance_selectstylepack2(inputs)
});
export { boost_cms_appearance_selectstylepack2 as "boost.cms.appearance.selectStylePack" }