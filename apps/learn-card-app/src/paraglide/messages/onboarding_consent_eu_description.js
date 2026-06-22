/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_DescriptionInputs */

const en_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter your parent's email so we can send them a consent request.`)
};

const es_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa el correo de tu padre/madre para enviarles una solicitud de consentimiento.`)
};

const fr_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir l'e-mail de votre parent pour que nous puissions lui envoyer une demande de consentement.`)
};

const ar_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال البريد الإلكتروني لوالدك حتى نتمكن من إرسال طلب موافقة إليهم.`)
};

/**
* | output |
* | --- |
* | "Please enter your parent's email so we can send them a consent request." |
*
* @param {Onboarding_Consent_Eu_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_description = /** @type {((inputs?: Onboarding_Consent_Eu_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_description(inputs)
	if (locale === "es") return es_onboarding_consent_eu_description(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_description(inputs)
	return ar_onboarding_consent_eu_description(inputs)
});
export { onboarding_consent_eu_description as "onboarding.consent.eu.description" }