/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_Sendrequest1Inputs */

const en_onboarding_consent_eu_sendrequest1 = /** @type {(inputs: Onboarding_Consent_Eu_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Request`)
};

const es_onboarding_consent_eu_sendrequest1 = /** @type {(inputs: Onboarding_Consent_Eu_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar solicitud`)
};

const fr_onboarding_consent_eu_sendrequest1 = /** @type {(inputs: Onboarding_Consent_Eu_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la demande`)
};

const ar_onboarding_consent_eu_sendrequest1 = /** @type {(inputs: Onboarding_Consent_Eu_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال الطلب`)
};

/**
* | output |
* | --- |
* | "Send Request" |
*
* @param {Onboarding_Consent_Eu_Sendrequest1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_sendrequest1 = /** @type {((inputs?: Onboarding_Consent_Eu_Sendrequest1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_Sendrequest1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_sendrequest1(inputs)
	if (locale === "es") return es_onboarding_consent_eu_sendrequest1(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_sendrequest1(inputs)
	return ar_onboarding_consent_eu_sendrequest1(inputs)
});
export { onboarding_consent_eu_sendrequest1 as "onboarding.consent.eu.sendRequest" }