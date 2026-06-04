/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_SendingInputs */

const en_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando...`)
};

const de_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird gesendet...`)
};

const ar_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإرسال...`)
};

const fr_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi en cours...`)
};

const ko_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전송 중...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Onboarding_Consent_Eu_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_sending = /** @type {((inputs?: Onboarding_Consent_Eu_SendingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_SendingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_sending(inputs)
	if (locale === "es") return es_onboarding_consent_eu_sending(inputs)
	if (locale === "de") return de_onboarding_consent_eu_sending(inputs)
	if (locale === "ar") return ar_onboarding_consent_eu_sending(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_sending(inputs)
	return ko_onboarding_consent_eu_sending(inputs)
});
export { onboarding_consent_eu_sending as "onboarding.consent.eu.sending" }