/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Joiningnetwork1Inputs */

const en_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joining Network...`)
};

const es_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uniéndose a la red...`)
};

const de_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Netzwerk beitreten...`)
};

const ar_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الانضمام إلى الشبكة...`)
};

const fr_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion au réseau...`)
};

const ko_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`네트워크 참여 중...`)
};

/**
* | output |
* | --- |
* | "Joining Network..." |
*
* @param {Onboarding_Profile_Joiningnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_joiningnetwork1 = /** @type {((inputs?: Onboarding_Profile_Joiningnetwork1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Joiningnetwork1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_joiningnetwork1(inputs)
	if (locale === "es") return es_onboarding_profile_joiningnetwork1(inputs)
	if (locale === "de") return de_onboarding_profile_joiningnetwork1(inputs)
	if (locale === "ar") return ar_onboarding_profile_joiningnetwork1(inputs)
	if (locale === "fr") return fr_onboarding_profile_joiningnetwork1(inputs)
	return ko_onboarding_profile_joiningnetwork1(inputs)
});
export { onboarding_profile_joiningnetwork1 as "onboarding.profile.joiningNetwork" }