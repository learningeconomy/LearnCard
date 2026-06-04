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

const de_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hast du einen Schulcode?`)
};

const ar_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل لديك رمز مدرسة؟`)
};

const fr_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez un code école ?`)
};

const ko_onboarding_consent_underage_schoolcode_cta1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학교 코드가 있나요?`)
};

/**
* | output |
* | --- |
* | "Have a school code?" |
*
* @param {Onboarding_Consent_Underage_Schoolcode_Cta1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_schoolcode_cta1 = /** @type {((inputs?: Onboarding_Consent_Underage_Schoolcode_Cta1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Schoolcode_Cta1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_schoolcode_cta1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_schoolcode_cta1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_schoolcode_cta1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_schoolcode_cta1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_schoolcode_cta1(inputs)
	return ko_onboarding_consent_underage_schoolcode_cta1(inputs)
});
export { onboarding_consent_underage_schoolcode_cta1 as "onboarding.consent.underage.schoolCode.cta" }