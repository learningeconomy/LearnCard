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

const de_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beim Erstellen deines Profils ist ein Fehler aufgetreten`)
};

const ar_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ أثناء إنشاء ملفك الشخصي`)
};

const fr_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue lors de la création de votre profil`)
};

const ko_onboarding_profile_error_createfailed1 = /** @type {(inputs: Onboarding_Profile_Error_Createfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필을 만드는 중 오류가 발생했습니다`)
};

/**
* | output |
* | --- |
* | "There was an error creating your profile" |
*
* @param {Onboarding_Profile_Error_Createfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_createfailed1 = /** @type {((inputs?: Onboarding_Profile_Error_Createfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_Createfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_createfailed1(inputs)
	if (locale === "es") return es_onboarding_profile_error_createfailed1(inputs)
	if (locale === "de") return de_onboarding_profile_error_createfailed1(inputs)
	if (locale === "ar") return ar_onboarding_profile_error_createfailed1(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_createfailed1(inputs)
	return ko_onboarding_profile_error_createfailed1(inputs)
});
export { onboarding_profile_error_createfailed1 as "onboarding.profile.error.createFailed" }