/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_HeadingInputs */

const en_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parental Consent Required`)
};

const es_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentimiento parental requerido`)
};

const fr_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentement parental requis`)
};

const ar_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موافقة الوالدين مطلوبة`)
};

/**
* | output |
* | --- |
* | "Parental Consent Required" |
*
* @param {Onboarding_Consent_Eu_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_heading = /** @type {((inputs?: Onboarding_Consent_Eu_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_heading(inputs)
	if (locale === "es") return es_onboarding_consent_eu_heading(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_heading(inputs)
	return ar_onboarding_consent_eu_heading(inputs)
});
export { onboarding_consent_eu_heading as "onboarding.consent.eu.heading" }