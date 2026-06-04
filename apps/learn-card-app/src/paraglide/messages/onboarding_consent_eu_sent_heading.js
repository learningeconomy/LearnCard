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

const de_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anfrage gesendet`)
};

const ar_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال الطلب`)
};

const fr_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande envoyée`)
};

const ko_onboarding_consent_eu_sent_heading = /** @type {(inputs: Onboarding_Consent_Eu_Sent_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`요청 전송됨`)
};

/**
* | output |
* | --- |
* | "Request Sent" |
*
* @param {Onboarding_Consent_Eu_Sent_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_sent_heading = /** @type {((inputs?: Onboarding_Consent_Eu_Sent_HeadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_Sent_HeadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_sent_heading(inputs)
	if (locale === "es") return es_onboarding_consent_eu_sent_heading(inputs)
	if (locale === "de") return de_onboarding_consent_eu_sent_heading(inputs)
	if (locale === "ar") return ar_onboarding_consent_eu_sent_heading(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_sent_heading(inputs)
	return ko_onboarding_consent_eu_sent_heading(inputs)
});
export { onboarding_consent_eu_sent_heading as "onboarding.consent.eu.sent.heading" }