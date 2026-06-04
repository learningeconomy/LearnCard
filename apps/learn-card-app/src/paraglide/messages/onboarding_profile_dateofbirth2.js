/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Dateofbirth2Inputs */

const en_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date of Birth`)
};

const es_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de nacimiento`)
};

const de_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Geburtsdatum`)
};

const ar_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الميلاد`)
};

const fr_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de naissance`)
};

const ko_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`생년월일`)
};

/**
* | output |
* | --- |
* | "Date of Birth" |
*
* @param {Onboarding_Profile_Dateofbirth2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_dateofbirth2 = /** @type {((inputs?: Onboarding_Profile_Dateofbirth2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Dateofbirth2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_dateofbirth2(inputs)
	if (locale === "es") return es_onboarding_profile_dateofbirth2(inputs)
	if (locale === "de") return de_onboarding_profile_dateofbirth2(inputs)
	if (locale === "ar") return ar_onboarding_profile_dateofbirth2(inputs)
	if (locale === "fr") return fr_onboarding_profile_dateofbirth2(inputs)
	return ko_onboarding_profile_dateofbirth2(inputs)
});
export { onboarding_profile_dateofbirth2 as "onboarding.profile.dateOfBirth" }