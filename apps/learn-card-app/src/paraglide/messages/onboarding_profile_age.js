/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ age: NonNullable<unknown> }} Onboarding_Profile_AgeInputs */

const en_onboarding_profile_age = /** @type {(inputs: Onboarding_Profile_AgeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Age: ${i?.age}`)
};

const es_onboarding_profile_age = /** @type {(inputs: Onboarding_Profile_AgeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Edad: ${i?.age}`)
};

const de_onboarding_profile_age = /** @type {(inputs: Onboarding_Profile_AgeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Alter: ${i?.age}`)
};

const ar_onboarding_profile_age = /** @type {(inputs: Onboarding_Profile_AgeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`العمر: ${i?.age}`)
};

const fr_onboarding_profile_age = /** @type {(inputs: Onboarding_Profile_AgeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Âge : ${i?.age}`)
};

const ko_onboarding_profile_age = /** @type {(inputs: Onboarding_Profile_AgeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`나이: ${i?.age}`)
};

/**
* | output |
* | --- |
* | "Age: {age}" |
*
* @param {Onboarding_Profile_AgeInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_age = /** @type {((inputs: Onboarding_Profile_AgeInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_AgeInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_age(inputs)
	if (locale === "es") return es_onboarding_profile_age(inputs)
	if (locale === "de") return de_onboarding_profile_age(inputs)
	if (locale === "ar") return ar_onboarding_profile_age(inputs)
	if (locale === "fr") return fr_onboarding_profile_age(inputs)
	return ko_onboarding_profile_age(inputs)
});
export { onboarding_profile_age as "onboarding.profile.age" }