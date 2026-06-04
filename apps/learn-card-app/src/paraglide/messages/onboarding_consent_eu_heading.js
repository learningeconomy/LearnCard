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

const de_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elterliche Zustimmung erforderlich`)
};

const ar_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موافقة الوالدين مطلوبة`)
};

const fr_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentement parental requis`)
};

const ko_onboarding_consent_eu_heading = /** @type {(inputs: Onboarding_Consent_Eu_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부모 동의 필요`)
};

/**
* | output |
* | --- |
* | "Parental Consent Required" |
*
* @param {Onboarding_Consent_Eu_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_heading = /** @type {((inputs?: Onboarding_Consent_Eu_HeadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_HeadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_heading(inputs)
	if (locale === "es") return es_onboarding_consent_eu_heading(inputs)
	if (locale === "de") return de_onboarding_consent_eu_heading(inputs)
	if (locale === "ar") return ar_onboarding_consent_eu_heading(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_heading(inputs)
	return ko_onboarding_consent_eu_heading(inputs)
});
export { onboarding_consent_eu_heading as "onboarding.consent.eu.heading" }