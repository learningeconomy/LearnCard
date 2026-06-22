/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Error_Countryrequired1Inputs */

const en_onboarding_profile_error_countryrequired1 = /** @type {(inputs: Onboarding_Profile_Error_Countryrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Country is required.`)
};

const es_onboarding_profile_error_countryrequired1 = /** @type {(inputs: Onboarding_Profile_Error_Countryrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere país.`)
};

const fr_onboarding_profile_error_countryrequired1 = /** @type {(inputs: Onboarding_Profile_Error_Countryrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le pays est requis.`)
};

const ar_onboarding_profile_error_countryrequired1 = /** @type {(inputs: Onboarding_Profile_Error_Countryrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البلد مطلوب.`)
};

/**
* | output |
* | --- |
* | "Country is required." |
*
* @param {Onboarding_Profile_Error_Countryrequired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_countryrequired1 = /** @type {((inputs?: Onboarding_Profile_Error_Countryrequired1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_Countryrequired1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_countryrequired1(inputs)
	if (locale === "es") return es_onboarding_profile_error_countryrequired1(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_countryrequired1(inputs)
	return ar_onboarding_profile_error_countryrequired1(inputs)
});
export { onboarding_profile_error_countryrequired1 as "onboarding.profile.error.countryRequired" }