/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Editappearance1Inputs */

const en_boost_cms_appearance_editappearance1 = /** @type {(inputs: Boost_Cms_Appearance_Editappearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Appearance`)
};

const es_boost_cms_appearance_editappearance1 = /** @type {(inputs: Boost_Cms_Appearance_Editappearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar apariencia`)
};

const fr_boost_cms_appearance_editappearance1 = /** @type {(inputs: Boost_Cms_Appearance_Editappearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier l'apparence`)
};

const ar_boost_cms_appearance_editappearance1 = /** @type {(inputs: Boost_Cms_Appearance_Editappearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل المظهر`)
};

/**
* | output |
* | --- |
* | "Edit Appearance" |
*
* @param {Boost_Cms_Appearance_Editappearance1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_editappearance1 = /** @type {((inputs?: Boost_Cms_Appearance_Editappearance1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Editappearance1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_editappearance1(inputs)
	if (locale === "es") return es_boost_cms_appearance_editappearance1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_editappearance1(inputs)
	return ar_boost_cms_appearance_editappearance1(inputs)
});
export { boost_cms_appearance_editappearance1 as "boost.cms.appearance.editAppearance" }