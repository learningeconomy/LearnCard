/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Ima1Inputs */

const en_onboarding_profile_ima1 = /** @type {(inputs: Onboarding_Profile_Ima1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I'm a `)
};

const es_onboarding_profile_ima1 = /** @type {(inputs: Onboarding_Profile_Ima1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soy `)
};

const fr_onboarding_profile_ima1 = /** @type {(inputs: Onboarding_Profile_Ima1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis `)
};

const ar_onboarding_profile_ima1 = /** @type {(inputs: Onboarding_Profile_Ima1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا `)
};

/**
* | output |
* | --- |
* | "I'm a" |
*
* @param {Onboarding_Profile_Ima1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_ima1 = /** @type {((inputs?: Onboarding_Profile_Ima1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Ima1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_ima1(inputs)
	if (locale === "es") return es_onboarding_profile_ima1(inputs)
	if (locale === "fr") return fr_onboarding_profile_ima1(inputs)
	return ar_onboarding_profile_ima1(inputs)
});
export { onboarding_profile_ima1 as "onboarding.profile.imA" }