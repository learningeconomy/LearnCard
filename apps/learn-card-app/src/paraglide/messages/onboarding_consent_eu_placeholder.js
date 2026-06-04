/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_PlaceholderInputs */

const en_onboarding_consent_eu_placeholder = /** @type {(inputs: Onboarding_Consent_Eu_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parent's email`)
};

const es_onboarding_consent_eu_placeholder = /** @type {(inputs: Onboarding_Consent_Eu_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo del padre/madre`)
};

const de_onboarding_consent_eu_placeholder = /** @type {(inputs: Onboarding_Consent_Eu_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-Mail der Eltern`)
};

const ar_onboarding_consent_eu_placeholder = /** @type {(inputs: Onboarding_Consent_Eu_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني للوالد`)
};

const fr_onboarding_consent_eu_placeholder = /** @type {(inputs: Onboarding_Consent_Eu_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail du parent`)
};

const ko_onboarding_consent_eu_placeholder = /** @type {(inputs: Onboarding_Consent_Eu_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부모님 이메일`)
};

/**
* | output |
* | --- |
* | "Parent's email" |
*
* @param {Onboarding_Consent_Eu_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_placeholder = /** @type {((inputs?: Onboarding_Consent_Eu_PlaceholderInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_PlaceholderInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_placeholder(inputs)
	if (locale === "es") return es_onboarding_consent_eu_placeholder(inputs)
	if (locale === "de") return de_onboarding_consent_eu_placeholder(inputs)
	if (locale === "ar") return ar_onboarding_consent_eu_placeholder(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_placeholder(inputs)
	return ko_onboarding_consent_eu_placeholder(inputs)
});
export { onboarding_consent_eu_placeholder as "onboarding.consent.eu.placeholder" }