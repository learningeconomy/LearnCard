/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Deletingaccount2Inputs */

const en_userprofile_deletingaccount2 = /** @type {(inputs: Userprofile_Deletingaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deleting Account...`)
};

const es_userprofile_deletingaccount2 = /** @type {(inputs: Userprofile_Deletingaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminando Cuenta...`)
};

const fr_userprofile_deletingaccount2 = /** @type {(inputs: Userprofile_Deletingaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suppression du compte...`)
};

const ar_userprofile_deletingaccount2 = /** @type {(inputs: Userprofile_Deletingaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري حذف الحساب...`)
};

/**
* | output |
* | --- |
* | "Deleting Account..." |
*
* @param {Userprofile_Deletingaccount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_deletingaccount2 = /** @type {((inputs?: Userprofile_Deletingaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Deletingaccount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_deletingaccount2(inputs)
	if (locale === "es") return es_userprofile_deletingaccount2(inputs)
	if (locale === "fr") return fr_userprofile_deletingaccount2(inputs)
	return ar_userprofile_deletingaccount2(inputs)
});
export { userprofile_deletingaccount2 as "userProfile.deletingAccount" }