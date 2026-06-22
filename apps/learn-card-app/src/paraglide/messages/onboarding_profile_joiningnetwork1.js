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

const fr_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion au réseau...`)
};

const ar_onboarding_profile_joiningnetwork1 = /** @type {(inputs: Onboarding_Profile_Joiningnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الانضمام إلى الشبكة...`)
};

/**
* | output |
* | --- |
* | "Joining Network..." |
*
* @param {Onboarding_Profile_Joiningnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_joiningnetwork1 = /** @type {((inputs?: Onboarding_Profile_Joiningnetwork1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Joiningnetwork1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_joiningnetwork1(inputs)
	if (locale === "es") return es_onboarding_profile_joiningnetwork1(inputs)
	if (locale === "fr") return fr_onboarding_profile_joiningnetwork1(inputs)
	return ar_onboarding_profile_joiningnetwork1(inputs)
});
export { onboarding_profile_joiningnetwork1 as "onboarding.profile.joiningNetwork" }