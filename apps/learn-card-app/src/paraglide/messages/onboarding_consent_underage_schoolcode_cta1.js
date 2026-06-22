/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Schoolcode_Cta1Inputs */

const en_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Have a school code?`)
};

const es_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Tienes un código escolar?`)
};

const fr_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez un code école ?`)
};

const ar_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل لديك رمز مدرسة؟`)
};

/**
* | output |
* | --- |
* | "Have a school code?" |
*
* @param {Onboarding_Consent_Underage_Schoolcode_Cta1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_schoolcode_cta1 = /** @type {((inputs?: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Schoolcode_Cta1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_schoolcode_cta1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_schoolcode_cta1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_schoolcode_cta1(inputs)
	return ar_onboarding_consent_underage_schoolcode_cta1(inputs)
});
export { onboarding_consent_underage_schoolcode_cta1 as "onboarding.consent.underage.schoolCode.cta" }