/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Parentinvite_Placeholder1Inputs */

const en_onboarding_consent_parentinvite_placeholder1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`email@email.com`)
};

const es_onboarding_consent_parentinvite_placeholder1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`correo@correo.com`)
};

const de_onboarding_consent_parentinvite_placeholder1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`email@email.com`)
};

const ar_onboarding_consent_parentinvite_placeholder1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`email@email.com`)
};

const fr_onboarding_consent_parentinvite_placeholder1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`email@email.com`)
};

const ko_onboarding_consent_parentinvite_placeholder1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`email@email.com`)
};

/**
* | output |
* | --- |
* | "email@email.com" |
*
* @param {Onboarding_Consent_Parentinvite_Placeholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_placeholder1 = /** @type {((inputs?: Onboarding_Consent_Parentinvite_Placeholder1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Placeholder1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_parentinvite_placeholder1(inputs)
	if (locale === "es") return es_onboarding_consent_parentinvite_placeholder1(inputs)
	if (locale === "de") return de_onboarding_consent_parentinvite_placeholder1(inputs)
	if (locale === "ar") return ar_onboarding_consent_parentinvite_placeholder1(inputs)
	if (locale === "fr") return fr_onboarding_consent_parentinvite_placeholder1(inputs)
	return ko_onboarding_consent_parentinvite_placeholder1(inputs)
});
export { onboarding_consent_parentinvite_placeholder1 as "onboarding.consent.parentInvite.placeholder" }