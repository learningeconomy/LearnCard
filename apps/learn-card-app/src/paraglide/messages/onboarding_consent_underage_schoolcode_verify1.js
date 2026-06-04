/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Schoolcode_Verify1Inputs */

const en_onboarding_consent_underage_schoolcode_verify1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Verify1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify`)
};

const es_onboarding_consent_underage_schoolcode_verify1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Verify1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar`)
};

const de_onboarding_consent_underage_schoolcode_verify1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Verify1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Überprüfen`)
};

const ar_onboarding_consent_underage_schoolcode_verify1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Verify1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق`)
};

const fr_onboarding_consent_underage_schoolcode_verify1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Verify1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier`)
};

const ko_onboarding_consent_underage_schoolcode_verify1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Verify1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인`)
};

/**
* | output |
* | --- |
* | "Verify" |
*
* @param {Onboarding_Consent_Underage_Schoolcode_Verify1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_schoolcode_verify1 = /** @type {((inputs?: Onboarding_Consent_Underage_Schoolcode_Verify1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Schoolcode_Verify1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_schoolcode_verify1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_schoolcode_verify1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_schoolcode_verify1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_schoolcode_verify1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_schoolcode_verify1(inputs)
	return ko_onboarding_consent_underage_schoolcode_verify1(inputs)
});
export { onboarding_consent_underage_schoolcode_verify1 as "onboarding.consent.underage.schoolCode.verify" }