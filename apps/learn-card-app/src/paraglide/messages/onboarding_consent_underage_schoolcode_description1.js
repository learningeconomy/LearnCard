/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Schoolcode_Description1Inputs */

const en_onboarding_consent_underage_schoolcode_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To join without a parent account, please enter the special code provided by your school.`)
};

const es_onboarding_consent_underage_schoolcode_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Para unirte sin una cuenta de padre, ingresa el código especial proporcionado por tu escuela.`)
};

const de_onboarding_consent_underage_schoolcode_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Um ohne Elternkonto beizutreten, gib bitte den speziellen Code deiner Schule ein.`)
};

const ar_onboarding_consent_underage_schoolcode_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`للانضمام بدون حساب والد، يرجى إدخال الرمز الخاص المقدم من مدرستك.`)
};

const fr_onboarding_consent_underage_schoolcode_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour rejoindre sans compte parent, veuillez saisir le code spécial fourni par votre école.`)
};

const ko_onboarding_consent_underage_schoolcode_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Schoolcode_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부모 계정 없이 참여하려면 학교에서 제공한 특별 코드를 입력하세요.`)
};

/**
* | output |
* | --- |
* | "To join without a parent account, please enter the special code provided by your school." |
*
* @param {Onboarding_Consent_Underage_Schoolcode_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_schoolcode_description1 = /** @type {((inputs?: Onboarding_Consent_Underage_Schoolcode_Description1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Schoolcode_Description1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_schoolcode_description1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_schoolcode_description1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_schoolcode_description1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_schoolcode_description1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_schoolcode_description1(inputs)
	return ko_onboarding_consent_underage_schoolcode_description1(inputs)
});
export { onboarding_consent_underage_schoolcode_description1 as "onboarding.consent.underage.schoolCode.description" }