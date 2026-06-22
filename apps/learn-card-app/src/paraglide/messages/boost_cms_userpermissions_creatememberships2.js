/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Userpermissions_Creatememberships2Inputs */

const en_boost_cms_userpermissions_creatememberships2 = /** @type {(inputs: Boost_Cms_Userpermissions_Creatememberships2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Memberships`)
};

const es_boost_cms_userpermissions_creatememberships2 = /** @type {(inputs: Boost_Cms_Userpermissions_Creatememberships2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear membresías`)
};

const fr_boost_cms_userpermissions_creatememberships2 = /** @type {(inputs: Boost_Cms_Userpermissions_Creatememberships2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des adhésions`)
};

const ar_boost_cms_userpermissions_creatememberships2 = /** @type {(inputs: Boost_Cms_Userpermissions_Creatememberships2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء عضويات`)
};

/**
* | output |
* | --- |
* | "Create Memberships" |
*
* @param {Boost_Cms_Userpermissions_Creatememberships2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_userpermissions_creatememberships2 = /** @type {((inputs?: Boost_Cms_Userpermissions_Creatememberships2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Userpermissions_Creatememberships2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_userpermissions_creatememberships2(inputs)
	if (locale === "es") return es_boost_cms_userpermissions_creatememberships2(inputs)
	if (locale === "fr") return fr_boost_cms_userpermissions_creatememberships2(inputs)
	return ar_boost_cms_userpermissions_creatememberships2(inputs)
});
export { boost_cms_userpermissions_creatememberships2 as "boost.cms.userPermissions.createMemberships" }