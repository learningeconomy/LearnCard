/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Loggingout_Description1Inputs */

const en_onboarding_consent_underage_loggingout_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please get a parent or guardian to login and create a family account.`)
};

const es_onboarding_consent_underage_loggingout_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pide a un padre o tutor que inicie sesión y cree una cuenta familiar.`)
};

const de_onboarding_consent_underage_loggingout_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte lass einen Elternteil oder Erziehungsberechtigten sich anmelden und ein Familienkonto erstellen.`)
};

const ar_onboarding_consent_underage_loggingout_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى مطالبة أحد الوالدين أو الوصي بتسجيل الدخول وإنشاء حساب عائلي.`)
};

const fr_onboarding_consent_underage_loggingout_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez demander à un parent ou tuteur de se connecter et de créer un compte familial.`)
};

const ko_onboarding_consent_underage_loggingout_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Loggingout_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부모 또는 보호자가 로그인하여 가족 계정을 만들도록 요청하세요.`)
};

/**
* | output |
* | --- |
* | "Please get a parent or guardian to login and create a family account." |
*
* @param {Onboarding_Consent_Underage_Loggingout_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_loggingout_description1 = /** @type {((inputs?: Onboarding_Consent_Underage_Loggingout_Description1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Loggingout_Description1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_loggingout_description1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_loggingout_description1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_loggingout_description1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_loggingout_description1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_loggingout_description1(inputs)
	return ko_onboarding_consent_underage_loggingout_description1(inputs)
});
export { onboarding_consent_underage_loggingout_description1 as "onboarding.consent.underage.loggingOut.description" }