/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Error_Createfailed1Inputs */

const en_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`There was an error creating your profile`)
};

const es_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hubo un error al crear tu perfil`)
};

const fr_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue lors de la création de votre profil`)
};

const ar_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ أثناء إنشاء ملفك الشخصي`)
};

/**
* | output |
* | --- |
* | "There was an error creating your profile" |
*
* @param {Onboarding_Profile_Error_Createfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_createfailed1 = /** @type {((inputs?: Onboarding_Profile_Error_Createfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_Createfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_createfailed1(inputs)
	if (locale === "es") return es_onboarding_profile_error_createfailed1(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_createfailed1(inputs)
	return ar_onboarding_profile_error_createfailed1(inputs)
});
export { onboarding_profile_error_createfailed1 as "onboarding.profile.error.createFailed" }