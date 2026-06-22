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

const fr_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi en cours...`)
};

const ar_onboarding_consent_eu_sending = /** @type {(inputs: Onboarding_Consent_Eu_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإرسال...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Onboarding_Consent_Eu_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_sending = /** @type {((inputs?: Onboarding_Consent_Eu_SendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_SendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_sending(inputs)
	if (locale === "es") return es_onboarding_consent_eu_sending(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_sending(inputs)
	return ar_onboarding_consent_eu_sending(inputs)
});
export { onboarding_consent_eu_sending as "onboarding.consent.eu.sending" }