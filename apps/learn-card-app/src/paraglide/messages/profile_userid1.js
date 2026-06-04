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

const de_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benutzer-ID`)
};

const ar_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المستخدم`)
};

const fr_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de l'utilisateur`)
};

const ko_profile_userid1 = /** @type {(inputs: Profile_Userid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용자 ID`)
};

/**
* | output |
* | --- |
* | "User ID" |
*
* @param {Profile_Userid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_userid1 = /** @type {((inputs?: Profile_Userid1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Userid1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_userid1(inputs)
	if (locale === "es") return es_profile_userid1(inputs)
	if (locale === "de") return de_profile_userid1(inputs)
	if (locale === "ar") return ar_profile_userid1(inputs)
	if (locale === "fr") return fr_profile_userid1(inputs)
	return ko_profile_userid1(inputs)
});
export { profile_userid1 as "profile.userId" }