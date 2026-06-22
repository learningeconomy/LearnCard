/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_Recentloginrequired2Inputs */

const en_profile_delete_recentloginrequired2 = /** @type {(inputs: Profile_Delete_Recentloginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A recent login is required!`)
};

const es_profile_delete_recentloginrequired2 = /** @type {(inputs: Profile_Delete_Recentloginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Se requiere un inicio de sesión reciente!`)
};

const fr_profile_delete_recentloginrequired2 = /** @type {(inputs: Profile_Delete_Recentloginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une connexion récente est requise !`)
};

const ar_profile_delete_recentloginrequired2 = /** @type {(inputs: Profile_Delete_Recentloginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب تسجيل الدخول الأخير!`)
};

/**
* | output |
* | --- |
* | "A recent login is required!" |
*
* @param {Profile_Delete_Recentloginrequired2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_delete_recentloginrequired2 = /** @type {((inputs?: Profile_Delete_Recentloginrequired2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_Recentloginrequired2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_recentloginrequired2(inputs)
	if (locale === "es") return es_profile_delete_recentloginrequired2(inputs)
	if (locale === "fr") return fr_profile_delete_recentloginrequired2(inputs)
	return ar_profile_delete_recentloginrequired2(inputs)
});
export { profile_delete_recentloginrequired2 as "profile.delete.recentLoginRequired" }