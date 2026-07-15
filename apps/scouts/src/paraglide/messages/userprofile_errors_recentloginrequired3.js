/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Errors_Recentloginrequired3Inputs */

const en_userprofile_errors_recentloginrequired3 = /** @type {(inputs: Userprofile_Errors_Recentloginrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A recent login is required!`)
};

const es_userprofile_errors_recentloginrequired3 = /** @type {(inputs: Userprofile_Errors_Recentloginrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Se requiere un inicio de sesión reciente!`)
};

const fr_userprofile_errors_recentloginrequired3 = /** @type {(inputs: Userprofile_Errors_Recentloginrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une connexion récente est requise !`)
};

const ar_userprofile_errors_recentloginrequired3 = /** @type {(inputs: Userprofile_Errors_Recentloginrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب تسجيل دخول حديث!`)
};

/**
* | output |
* | --- |
* | "A recent login is required!" |
*
* @param {Userprofile_Errors_Recentloginrequired3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_errors_recentloginrequired3 = /** @type {((inputs?: Userprofile_Errors_Recentloginrequired3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Errors_Recentloginrequired3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_errors_recentloginrequired3(inputs)
	if (locale === "es") return es_userprofile_errors_recentloginrequired3(inputs)
	if (locale === "fr") return fr_userprofile_errors_recentloginrequired3(inputs)
	return ar_userprofile_errors_recentloginrequired3(inputs)
});
export { userprofile_errors_recentloginrequired3 as "userProfile.errors.recentLoginRequired" }