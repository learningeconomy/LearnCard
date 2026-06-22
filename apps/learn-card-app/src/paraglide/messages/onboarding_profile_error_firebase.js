/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Onboarding_Profile_Error_FirebaseInputs */

const en_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`There was a firebase error: ${i?.error}`)
};

const es_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hubo un error de Firebase: ${i?.error}`)
};

const fr_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Une erreur Firebase est survenue : ${i?.error}`)
};

const ar_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حدث خطأ في Firebase: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "There was a firebase error: {error}" |
*
* @param {Onboarding_Profile_Error_FirebaseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_firebase = /** @type {((inputs: Onboarding_Profile_Error_FirebaseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_FirebaseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_firebase(inputs)
	if (locale === "es") return es_onboarding_profile_error_firebase(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_firebase(inputs)
	return ar_onboarding_profile_error_firebase(inputs)
});
export { onboarding_profile_error_firebase as "onboarding.profile.error.firebase" }