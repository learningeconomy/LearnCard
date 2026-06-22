/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Userpermissions_Createids3Inputs */

const en_boost_cms_userpermissions_createids3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createids3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create IDs`)
};

const es_boost_cms_userpermissions_createids3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createids3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear IDs`)
};

const fr_boost_cms_userpermissions_createids3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createids3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des identifiants`)
};

const ar_boost_cms_userpermissions_createids3 = /** @type {(inputs: Boost_Cms_Userpermissions_Createids3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء معرفات`)
};

/**
* | output |
* | --- |
* | "Create IDs" |
*
* @param {Boost_Cms_Userpermissions_Createids3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_userpermissions_createids3 = /** @type {((inputs?: Boost_Cms_Userpermissions_Createids3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Userpermissions_Createids3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_userpermissions_createids3(inputs)
	if (locale === "es") return es_boost_cms_userpermissions_createids3(inputs)
	if (locale === "fr") return fr_boost_cms_userpermissions_createids3(inputs)
	return ar_boost_cms_userpermissions_createids3(inputs)
});
export { boost_cms_userpermissions_createids3 as "boost.cms.userPermissions.createIDs" }