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

const de_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rolle auswählen`)
};

const ar_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار الدور`)
};

const fr_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le rôle`)
};

const ko_onboarding_profile_selectrole1 = /** @type {(inputs: Onboarding_Profile_Selectrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`역할 선택`)
};

/**
* | output |
* | --- |
* | "Select Role" |
*
* @param {Onboarding_Profile_Selectrole1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_selectrole1 = /** @type {((inputs?: Onboarding_Profile_Selectrole1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Selectrole1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_selectrole1(inputs)
	if (locale === "es") return es_onboarding_profile_selectrole1(inputs)
	if (locale === "de") return de_onboarding_profile_selectrole1(inputs)
	if (locale === "ar") return ar_onboarding_profile_selectrole1(inputs)
	if (locale === "fr") return fr_onboarding_profile_selectrole1(inputs)
	return ko_onboarding_profile_selectrole1(inputs)
});
export { onboarding_profile_selectrole1 as "onboarding.profile.selectRole" }