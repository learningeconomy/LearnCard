/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Fullname1Inputs */

const en_profile_fullname1 = /** @type {(inputs: Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Name`)
};

const es_profile_fullname1 = /** @type {(inputs: Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre completo`)
};

const de_profile_fullname1 = /** @type {(inputs: Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vollständiger Name`)
};

const ar_profile_fullname1 = /** @type {(inputs: Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم الكامل`)
};

const fr_profile_fullname1 = /** @type {(inputs: Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom et prénom`)
};

const ko_profile_fullname1 = /** @type {(inputs: Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`성명`)
};

/**
* | output |
* | --- |
* | "Full Name" |
*
* @param {Profile_Fullname1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_fullname1 = /** @type {((inputs?: Profile_Fullname1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Fullname1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_fullname1(inputs)
	if (locale === "es") return es_profile_fullname1(inputs)
	if (locale === "de") return de_profile_fullname1(inputs)
	if (locale === "ar") return ar_profile_fullname1(inputs)
	if (locale === "fr") return fr_profile_fullname1(inputs)
	return ko_profile_fullname1(inputs)
});
export { profile_fullname1 as "profile.fullName" }