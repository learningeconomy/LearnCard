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

const de_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte gib die E-Mail deiner Eltern ein, damit wir ihnen eine Zustimmungsanfrage senden können.`)
};

const ar_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال البريد الإلكتروني لوالدك حتى نتمكن من إرسال طلب موافقة إليهم.`)
};

const fr_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir l'e-mail de votre parent pour que nous puissions lui envoyer une demande de consentement.`)
};

const ko_onboarding_consent_eu_description = /** @type {(inputs: Onboarding_Consent_Eu_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부모의 이메일을 입력하여 동의 요청을 보내주세요.`)
};

/**
* | output |
* | --- |
* | "Please enter your parent's email so we can send them a consent request." |
*
* @param {Onboarding_Consent_Eu_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_description = /** @type {((inputs?: Onboarding_Consent_Eu_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_description(inputs)
	if (locale === "es") return es_onboarding_consent_eu_description(inputs)
	if (locale === "de") return de_onboarding_consent_eu_description(inputs)
	if (locale === "ar") return ar_onboarding_consent_eu_description(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_description(inputs)
	return ko_onboarding_consent_eu_description(inputs)
});
export { onboarding_consent_eu_description as "onboarding.consent.eu.description" }