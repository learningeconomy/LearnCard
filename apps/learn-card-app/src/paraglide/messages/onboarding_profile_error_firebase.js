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

const de_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Es gab einen Firebase-Fehler: ${i?.error}`)
};

const ar_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حدث خطأ في Firebase: ${i?.error}`)
};

const fr_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Une erreur Firebase est survenue : ${i?.error}`)
};

const ko_onboarding_profile_error_firebase = /** @type {(inputs: Onboarding_Profile_Error_FirebaseInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Firebase 오류 발생: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "There was a firebase error: {error}" |
*
* @param {Onboarding_Profile_Error_FirebaseInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_firebase = /** @type {((inputs: Onboarding_Profile_Error_FirebaseInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_FirebaseInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_firebase(inputs)
	if (locale === "es") return es_onboarding_profile_error_firebase(inputs)
	if (locale === "de") return de_onboarding_profile_error_firebase(inputs)
	if (locale === "ar") return ar_onboarding_profile_error_firebase(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_firebase(inputs)
	return ko_onboarding_profile_error_firebase(inputs)
});
export { onboarding_profile_error_firebase as "onboarding.profile.error.firebase" }