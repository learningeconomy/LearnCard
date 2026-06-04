/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Schoolcode_Error1Inputs */

const en_onboarding_consent_underage_schoolcode_error1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid school code. Please try again.`)
};

const es_onboarding_consent_underage_schoolcode_error1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código escolar inválido. Intenta de nuevo.`)
};

const de_onboarding_consent_underage_schoolcode_error1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ungültiger Schulcode. Bitte versuche es erneut.`)
};

const ar_onboarding_consent_underage_schoolcode_error1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز المدرسة غير صالح. يرجى المحاولة مرة أخرى.`)
};

const fr_onboarding_consent_underage_schoolcode_error1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code école invalide. Veuillez réessayer.`)
};

const ko_onboarding_consent_underage_schoolcode_error1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유효하지 않은 학교 코드입니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Invalid school code. Please try again." |
*
* @param {Onboarding_Consent_Underage_Schoolcode_Error1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_schoolcode_error1 = /** @type {((inputs?: Onboarding_Consent_Underage_Schoolcode_Error1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Schoolcode_Error1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_schoolcode_error1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_schoolcode_error1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_schoolcode_error1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_schoolcode_error1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_schoolcode_error1(inputs)
	return ko_onboarding_consent_underage_schoolcode_error1(inputs)
});
export { onboarding_consent_underage_schoolcode_error1 as "onboarding.consent.underage.schoolCode.error" }