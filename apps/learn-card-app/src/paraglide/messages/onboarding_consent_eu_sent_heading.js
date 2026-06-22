/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_Sent_HeadingInputs */

const en_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Sent`)
};

const es_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud enviada`)
};

const fr_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande envoyée`)
};

const ar_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال الطلب`)
};

/**
* | output |
* | --- |
* | "Request Sent" |
*
* @param {Onboarding_Consent_Eu_Sent_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_sent_heading = /** @type {((inputs?: Onboarding_Consent_Eu_Sent_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_Sent_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_sent_heading(inputs)
	if (locale === "es") return es_onboarding_consent_eu_sent_heading(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_sent_heading(inputs)
	return ar_onboarding_consent_eu_sent_heading(inputs)
});
export { onboarding_consent_eu_sent_heading as "onboarding.consent.eu.sent.heading" }