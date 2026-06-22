/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_HeaderInputs */

const en_onboarding_profile_header = /** @type {(inputs: Onboarding_Profile_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up your profile to get started!`)
};

const es_onboarding_profile_header = /** @type {(inputs: Onboarding_Profile_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Configura tu perfil para comenzar!`)
};

const fr_onboarding_profile_header = /** @type {(inputs: Onboarding_Profile_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez votre profil pour commencer !`)
};

const ar_onboarding_profile_header = /** @type {(inputs: Onboarding_Profile_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد ملفك الشخصي للبدء!`)
};

/**
* | output |
* | --- |
* | "Set up your profile to get started!" |
*
* @param {Onboarding_Profile_HeaderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_header = /** @type {((inputs?: Onboarding_Profile_HeaderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_HeaderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_header(inputs)
	if (locale === "es") return es_onboarding_profile_header(inputs)
	if (locale === "fr") return fr_onboarding_profile_header(inputs)
	return ar_onboarding_profile_header(inputs)
});
export { onboarding_profile_header as "onboarding.profile.header" }