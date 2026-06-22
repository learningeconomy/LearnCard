/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Roles_User1Inputs */

const en_admintools_roles_user1 = /** @type {(inputs: Admintools_Roles_User1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User`)
};

const es_admintools_roles_user1 = /** @type {(inputs: Admintools_Roles_User1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usuario`)
};

const fr_admintools_roles_user1 = /** @type {(inputs: Admintools_Roles_User1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisateur`)
};

const ar_admintools_roles_user1 = /** @type {(inputs: Admintools_Roles_User1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستخدم`)
};

/**
* | output |
* | --- |
* | "User" |
*
* @param {Admintools_Roles_User1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_roles_user1 = /** @type {((inputs?: Admintools_Roles_User1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Roles_User1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_roles_user1(inputs)
	if (locale === "es") return es_admintools_roles_user1(inputs)
	if (locale === "fr") return fr_admintools_roles_user1(inputs)
	return ar_admintools_roles_user1(inputs)
});
export { admintools_roles_user1 as "adminTools.roles.user" }