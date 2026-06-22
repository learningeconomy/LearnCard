/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Selectrole1Inputs */

const en_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Role`)
};

const es_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar rol`)
};

const fr_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le rôle`)
};

const ar_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار الدور`)
};

/**
* | output |
* | --- |
* | "Select Role" |
*
* @param {Onboarding_Profile_Selectrole1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_selectrole1 = /** @type {((inputs?: Onboarding_Profile_Selectrole1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Selectrole1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_selectrole1(inputs)
	if (locale === "es") return es_onboarding_profile_selectrole1(inputs)
	if (locale === "fr") return fr_onboarding_profile_selectrole1(inputs)
	return ar_onboarding_profile_selectrole1(inputs)
});
export { onboarding_profile_selectrole1 as "onboarding.profile.selectRole" }