/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Userid3Inputs */

const en_userprofile_userid3 = /** @type {(inputs: Userprofile_Userid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User ID`)
};

const es_userprofile_userid3 = /** @type {(inputs: Userprofile_Userid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Usuario`)
};

const fr_userprofile_userid3 = /** @type {(inputs: Userprofile_Userid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant utilisateur`)
};

const ar_userprofile_userid3 = /** @type {(inputs: Userprofile_Userid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المستخدم`)
};

/**
* | output |
* | --- |
* | "User ID" |
*
* @param {Userprofile_Userid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_userid3 = /** @type {((inputs?: Userprofile_Userid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Userid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_userid3(inputs)
	if (locale === "es") return es_userprofile_userid3(inputs)
	if (locale === "fr") return fr_userprofile_userid3(inputs)
	return ar_userprofile_userid3(inputs)
});
export { userprofile_userid3 as "userProfile.userID" }