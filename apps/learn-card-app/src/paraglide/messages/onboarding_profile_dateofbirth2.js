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

const fr_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de naissance`)
};

const ar_onboarding_profile_dateofbirth2 = /** @type {(inputs: Onboarding_Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الميلاد`)
};

/**
* | output |
* | --- |
* | "Date of Birth" |
*
* @param {Onboarding_Profile_Dateofbirth2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_dateofbirth2 = /** @type {((inputs?: Onboarding_Profile_Dateofbirth2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Dateofbirth2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_dateofbirth2(inputs)
	if (locale === "es") return es_onboarding_profile_dateofbirth2(inputs)
	if (locale === "fr") return fr_onboarding_profile_dateofbirth2(inputs)
	return ar_onboarding_profile_dateofbirth2(inputs)
});
export { onboarding_profile_dateofbirth2 as "onboarding.profile.dateOfBirth" }