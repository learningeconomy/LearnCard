/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_Error_Invalidemail1Inputs */

const en_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter a valid email.`)
};

const es_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa un correo válido.`)
};

const de_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte gib eine gültige E-Mail ein.`)
};

const ar_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال بريد إلكتروني صالح.`)
};

const fr_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir un e-mail valide.`)
};

const ko_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유효한 이메일을 입력하세요.`)
};

/**
* | output |
* | --- |
* | "Please enter a valid email." |
*
* @param {Onboarding_Consent_Eu_Error_Invalidemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_error_invalidemail1 = /** @type {((inputs?: Onboarding_Consent_Eu_Error_Invalidemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_Error_Invalidemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_error_invalidemail1(inputs)
	if (locale === "es") return es_onboarding_consent_eu_error_invalidemail1(inputs)
	if (locale === "de") return de_onboarding_consent_eu_error_invalidemail1(inputs)
	if (locale === "ar") return ar_onboarding_consent_eu_error_invalidemail1(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_error_invalidemail1(inputs)
	return ko_onboarding_consent_eu_error_invalidemail1(inputs)
});
export { onboarding_consent_eu_error_invalidemail1 as "onboarding.consent.eu.error.invalidEmail" }