/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Setuptitle1Inputs */

const en_profile_setuptitle1 = /** @type {(inputs: Profile_Setuptitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setup Your Profile`)
};

const es_profile_setuptitle1 = /** @type {(inputs: Profile_Setuptitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura tu perfil`)
};

const de_profile_setuptitle1 = /** @type {(inputs: Profile_Setuptitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Richte dein Profil ein`)
};

const ar_profile_setuptitle1 = /** @type {(inputs: Profile_Setuptitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد ملفك الشخصي`)
};

const fr_profile_setuptitle1 = /** @type {(inputs: Profile_Setuptitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez votre profil`)
};

const ko_profile_setuptitle1 = /** @type {(inputs: Profile_Setuptitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 설정`)
};

/**
* | output |
* | --- |
* | "Setup Your Profile" |
*
* @param {Profile_Setuptitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_setuptitle1 = /** @type {((inputs?: Profile_Setuptitle1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Setuptitle1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_setuptitle1(inputs)
	if (locale === "es") return es_profile_setuptitle1(inputs)
	if (locale === "de") return de_profile_setuptitle1(inputs)
	if (locale === "ar") return ar_profile_setuptitle1(inputs)
	if (locale === "fr") return fr_profile_setuptitle1(inputs)
	return ko_profile_setuptitle1(inputs)
});
export { profile_setuptitle1 as "profile.setupTitle" }