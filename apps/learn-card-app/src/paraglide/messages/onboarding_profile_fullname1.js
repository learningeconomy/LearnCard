/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Fullname1Inputs */

const en_onboarding_profile_fullname1 = /** @type {(inputs: Onboarding_Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Name`)
};

const es_onboarding_profile_fullname1 = /** @type {(inputs: Onboarding_Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre completo`)
};

const de_onboarding_profile_fullname1 = /** @type {(inputs: Onboarding_Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vollständiger Name`)
};

const ar_onboarding_profile_fullname1 = /** @type {(inputs: Onboarding_Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم الكامل`)
};

const fr_onboarding_profile_fullname1 = /** @type {(inputs: Onboarding_Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom complet`)
};

const ko_onboarding_profile_fullname1 = /** @type {(inputs: Onboarding_Profile_Fullname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전체 이름`)
};

/**
* | output |
* | --- |
* | "Full Name" |
*
* @param {Onboarding_Profile_Fullname1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_fullname1 = /** @type {((inputs?: Onboarding_Profile_Fullname1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Fullname1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_fullname1(inputs)
	if (locale === "es") return es_onboarding_profile_fullname1(inputs)
	if (locale === "de") return de_onboarding_profile_fullname1(inputs)
	if (locale === "ar") return ar_onboarding_profile_fullname1(inputs)
	if (locale === "fr") return fr_onboarding_profile_fullname1(inputs)
	return ko_onboarding_profile_fullname1(inputs)
});
export { onboarding_profile_fullname1 as "onboarding.profile.fullName" }