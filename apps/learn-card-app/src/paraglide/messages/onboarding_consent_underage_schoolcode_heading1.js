/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Schoolcode_Heading1Inputs */

const en_onboarding_consent_underage_schoolcode_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter School Code`)
};

const es_onboarding_consent_underage_schoolcode_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresar código escolar`)
};

const fr_onboarding_consent_underage_schoolcode_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisir le code école`)
};

const ar_onboarding_consent_underage_schoolcode_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل رمز المدرسة`)
};

/**
* | output |
* | --- |
* | "Enter School Code" |
*
* @param {Onboarding_Consent_Underage_Schoolcode_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_schoolcode_heading1 = /** @type {((inputs?: Onboarding_Consent_Underage_Schoolcode_Heading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Schoolcode_Heading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_schoolcode_heading1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_schoolcode_heading1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_schoolcode_heading1(inputs)
	return ar_onboarding_consent_underage_schoolcode_heading1(inputs)
});
export { onboarding_consent_underage_schoolcode_heading1 as "onboarding.consent.underage.schoolCode.heading" }