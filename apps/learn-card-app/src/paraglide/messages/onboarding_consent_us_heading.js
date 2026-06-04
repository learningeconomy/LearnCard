/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Us_HeadingInputs */

const en_onboarding_consent_us_heading = /** @type {(inputs: Onboarding_Consent_Us_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Notice`)
};

const es_onboarding_consent_us_heading = /** @type {(inputs: Onboarding_Consent_Us_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aviso de consentimiento`)
};

const de_onboarding_consent_us_heading = /** @type {(inputs: Onboarding_Consent_Us_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zustimmungshinweis`)
};

const ar_onboarding_consent_us_heading = /** @type {(inputs: Onboarding_Consent_Us_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعار الموافقة`)
};

const fr_onboarding_consent_us_heading = /** @type {(inputs: Onboarding_Consent_Us_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avis de consentement`)
};

const ko_onboarding_consent_us_heading = /** @type {(inputs: Onboarding_Consent_Us_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`동의 안내`)
};

/**
* | output |
* | --- |
* | "Consent Notice" |
*
* @param {Onboarding_Consent_Us_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_us_heading = /** @type {((inputs?: Onboarding_Consent_Us_HeadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Us_HeadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_us_heading(inputs)
	if (locale === "es") return es_onboarding_consent_us_heading(inputs)
	if (locale === "de") return de_onboarding_consent_us_heading(inputs)
	if (locale === "ar") return ar_onboarding_consent_us_heading(inputs)
	if (locale === "fr") return fr_onboarding_consent_us_heading(inputs)
	return ko_onboarding_consent_us_heading(inputs)
});
export { onboarding_consent_us_heading as "onboarding.consent.us.heading" }