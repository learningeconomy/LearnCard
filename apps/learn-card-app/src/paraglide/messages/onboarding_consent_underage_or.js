/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_OrInputs */

const en_onboarding_consent_underage_or = /** @type {(inputs: Onboarding_Consent_Underage_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or`)
};

const es_onboarding_consent_underage_or = /** @type {(inputs: Onboarding_Consent_Underage_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O`)
};

const de_onboarding_consent_underage_or = /** @type {(inputs: Onboarding_Consent_Underage_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oder`)
};

const ar_onboarding_consent_underage_or = /** @type {(inputs: Onboarding_Consent_Underage_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو`)
};

const fr_onboarding_consent_underage_or = /** @type {(inputs: Onboarding_Consent_Underage_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ou`)
};

const ko_onboarding_consent_underage_or = /** @type {(inputs: Onboarding_Consent_Underage_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`또는`)
};

/**
* | output |
* | --- |
* | "Or" |
*
* @param {Onboarding_Consent_Underage_OrInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_or = /** @type {((inputs?: Onboarding_Consent_Underage_OrInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_OrInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_or(inputs)
	if (locale === "es") return es_onboarding_consent_underage_or(inputs)
	if (locale === "de") return de_onboarding_consent_underage_or(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_or(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_or(inputs)
	return ko_onboarding_consent_underage_or(inputs)
});
export { onboarding_consent_underage_or as "onboarding.consent.underage.or" }