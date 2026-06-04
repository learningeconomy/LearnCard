/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Loggingout_Heading1Inputs */

const en_onboarding_consent_underage_loggingout_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logging out...`)
};

const es_onboarding_consent_underage_loggingout_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrando sesión...`)
};

const de_onboarding_consent_underage_loggingout_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird abgemeldet...`)
};

const ar_onboarding_consent_underage_loggingout_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تسجيل الخروج...`)
};

const fr_onboarding_consent_underage_loggingout_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion...`)
};

const ko_onboarding_consent_underage_loggingout_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로그아웃 중...`)
};

/**
* | output |
* | --- |
* | "Logging out..." |
*
* @param {Onboarding_Consent_Underage_Loggingout_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_loggingout_heading1 = /** @type {((inputs?: Onboarding_Consent_Underage_Loggingout_Heading1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Loggingout_Heading1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_loggingout_heading1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_loggingout_heading1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_loggingout_heading1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_loggingout_heading1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_loggingout_heading1(inputs)
	return ko_onboarding_consent_underage_loggingout_heading1(inputs)
});
export { onboarding_consent_underage_loggingout_heading1 as "onboarding.consent.underage.loggingOut.heading" }