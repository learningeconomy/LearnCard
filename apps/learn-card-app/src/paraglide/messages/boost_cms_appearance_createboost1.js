/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ search: NonNullable<unknown> }} Boost_Cms_Appearance_Createboost1Inputs */

const en_boost_cms_appearance_createboost1 = /** @type {(inputs: Boost_Cms_Appearance_Createboost1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Create "${i?.search}" Boost!`)
};

const es_boost_cms_appearance_createboost1 = /** @type {(inputs: Boost_Cms_Appearance_Createboost1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Crear boost "${i?.search}"!`)
};

const fr_boost_cms_appearance_createboost1 = /** @type {(inputs: Boost_Cms_Appearance_Createboost1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créer le boost "${i?.search}" !`)
};

const ar_boost_cms_appearance_createboost1 = /** @type {(inputs: Boost_Cms_Appearance_Createboost1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إنشاء بوست "${i?.search}"!`)
};

/**
* | output |
* | --- |
* | "Create \"{search}\" Boost!" |
*
* @param {Boost_Cms_Appearance_Createboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_createboost1 = /** @type {((inputs: Boost_Cms_Appearance_Createboost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Createboost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_createboost1(inputs)
	if (locale === "es") return es_boost_cms_appearance_createboost1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_createboost1(inputs)
	return ar_boost_cms_appearance_createboost1(inputs)
});
export { boost_cms_appearance_createboost1 as "boost.cms.appearance.createBoost" }