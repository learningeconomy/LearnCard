/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Userpermissions_Createcustomboosts3Inputs */

const en_boost_cms_userpermissions_createcustomboosts3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createcustomboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Custom Boosts`)
};

const es_boost_cms_userpermissions_createcustomboosts3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createcustomboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear boosts personalizados`)
};

const fr_boost_cms_userpermissions_createcustomboosts3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createcustomboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des boosts personnalisés`)
};

const ar_boost_cms_userpermissions_createcustomboosts3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createcustomboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء بوستات مخصصة`)
};

/**
* | output |
* | --- |
* | "Create Custom Boosts" |
*
* @param {Boost_Cms_Userpermissions_Createcustomboosts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_userpermissions_createcustomboosts3 = /** @type {((inputs?: Boost_Cms_Userpermissions_Createcustomboosts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Userpermissions_Createcustomboosts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_userpermissions_createcustomboosts3(inputs)
	if (locale === "es") return es_boost_cms_userpermissions_createcustomboosts3(inputs)
	if (locale === "fr") return fr_boost_cms_userpermissions_createcustomboosts3(inputs)
	return ar_boost_cms_userpermissions_createcustomboosts3(inputs)
});
export { boost_cms_userpermissions_createcustomboosts3 as "boost.cms.userPermissions.createCustomBoosts" }