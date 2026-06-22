/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Userid1Inputs */

const en_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User ID`)
};

const es_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de usuario`)
};

const fr_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de l'utilisateur`)
};

const ar_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المستخدم`)
};

/**
* | output |
* | --- |
* | "User ID" |
*
* @param {Profile_Userid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_userid1 = /** @type {((inputs?: Profile_Userid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Userid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_userid1(inputs)
	if (locale === "es") return es_profile_userid1(inputs)
	if (locale === "fr") return fr_profile_userid1(inputs)
	return ar_profile_userid1(inputs)
});
export { profile_userid1 as "profile.userId" }