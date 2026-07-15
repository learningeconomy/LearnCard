/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Userperms4Inputs */

const en_boostcms_userperms4 = /** @type {(inputs: Boostcms_Userperms4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User Permissions`)
};

const es_boostcms_userperms4 = /** @type {(inputs: Boostcms_Userperms4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos de Usuario`)
};

const fr_boostcms_userperms4 = /** @type {(inputs: Boostcms_Userperms4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations utilisateur`)
};

const ar_boostcms_userperms4 = /** @type {(inputs: Boostcms_Userperms4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User Permissions`)
};

/**
* | output |
* | --- |
* | "User Permissions" |
*
* @param {Boostcms_Userperms4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_userperms4 = /** @type {((inputs?: Boostcms_Userperms4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Userperms4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_userperms4(inputs)
	if (locale === "es") return es_boostcms_userperms4(inputs)
	if (locale === "fr") return fr_boostcms_userperms4(inputs)
	return ar_boostcms_userperms4(inputs)
});
export { boostcms_userperms4 as "boostCMS.userPerms" }