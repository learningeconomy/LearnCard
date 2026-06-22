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

const fr_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir un e-mail valide.`)
};

const ar_onboarding_consent_eu_error_invalidemail1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال بريد إلكتروني صالح.`)
};

/**
* | output |
* | --- |
* | "Please enter a valid email." |
*
* @param {Onboarding_Consent_Eu_Error_Invalidemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_error_invalidemail1 = /** @type {((inputs?: Onboarding_Consent_Eu_Error_Invalidemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_Error_Invalidemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_error_invalidemail1(inputs)
	if (locale === "es") return es_onboarding_consent_eu_error_invalidemail1(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_error_invalidemail1(inputs)
	return ar_onboarding_consent_eu_error_invalidemail1(inputs)
});
export { onboarding_consent_eu_error_invalidemail1 as "onboarding.consent.eu.error.invalidEmail" }