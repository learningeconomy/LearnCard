/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Parentinvite_Or1Inputs */

const en_onboarding_consent_parentinvite_or1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`or`)
};

const es_onboarding_consent_parentinvite_or1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`o`)
};

const fr_onboarding_consent_parentinvite_or1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ou`)
};

const ar_onboarding_consent_parentinvite_or1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو`)
};

/**
* | output |
* | --- |
* | "or" |
*
* @param {Onboarding_Consent_Parentinvite_Or1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_or1 = /** @type {((inputs?: Onboarding_Consent_Parentinvite_Or1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Or1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_parentinvite_or1(inputs)
	if (locale === "es") return es_onboarding_consent_parentinvite_or1(inputs)
	if (locale === "fr") return fr_onboarding_consent_parentinvite_or1(inputs)
	return ar_onboarding_consent_parentinvite_or1(inputs)
});
export { onboarding_consent_parentinvite_or1 as "onboarding.consent.parentInvite.or" }