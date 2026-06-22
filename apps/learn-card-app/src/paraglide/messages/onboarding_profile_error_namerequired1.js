/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Error_Namerequired1Inputs */

const en_onboarding_profile_error_namerequired1 = /** @type {(inputs: Onboarding_Profile_Error_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name is required.`)
};

const es_onboarding_profile_error_namerequired1 = /** @type {(inputs: Onboarding_Profile_Error_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere nombre.`)
};

const fr_onboarding_profile_error_namerequired1 = /** @type {(inputs: Onboarding_Profile_Error_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le nom est requis.`)
};

const ar_onboarding_profile_error_namerequired1 = /** @type {(inputs: Onboarding_Profile_Error_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم مطلوب.`)
};

/**
* | output |
* | --- |
* | "Name is required." |
*
* @param {Onboarding_Profile_Error_Namerequired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_namerequired1 = /** @type {((inputs?: Onboarding_Profile_Error_Namerequired1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_Namerequired1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_namerequired1(inputs)
	if (locale === "es") return es_onboarding_profile_error_namerequired1(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_namerequired1(inputs)
	return ar_onboarding_profile_error_namerequired1(inputs)
});
export { onboarding_profile_error_namerequired1 as "onboarding.profile.error.nameRequired" }