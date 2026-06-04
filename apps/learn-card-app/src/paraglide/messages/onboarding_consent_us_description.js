/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Us_DescriptionInputs */

const en_onboarding_consent_us_description = /** @type {(inputs: Onboarding_Consent_Us_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We collect learning progress and credentials. These can be shared with you, your teachers, or verified organizations.`)
};

const es_onboarding_consent_us_description = /** @type {(inputs: Onboarding_Consent_Us_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recopilamos progreso de aprendizaje y credenciales. Estos pueden compartirse contigo, tus profesores u organizaciones verificadas.`)
};

const de_onboarding_consent_us_description = /** @type {(inputs: Onboarding_Consent_Us_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wir erfassen Lernfortschritte und Nachweise. Diese können mit dir, deinen Lehrern oder verifizierten Organisationen geteilt werden.`)
};

const ar_onboarding_consent_us_description = /** @type {(inputs: Onboarding_Consent_Us_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نقوم بجمع تقدم التعلم وبيانات الاعتماد. يمكن مشاركتها معك ومع معلميك والمنظمات الموثقة.`)
};

const fr_onboarding_consent_us_description = /** @type {(inputs: Onboarding_Consent_Us_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous collectons les progrès d'apprentissage et les certifications. Ceux-ci peuvent être partagés avec vous, vos enseignants ou des organisations vérifiées.`)
};

const ko_onboarding_consent_us_description = /** @type {(inputs: Onboarding_Consent_Us_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습 진행 상황과 자격 증명을 수집합니다. 이는 귀하, 교사 또는 인증된 조직과 공유될 수 있습니다.`)
};

/**
* | output |
* | --- |
* | "We collect learning progress and credentials. These can be shared with you, your teachers, or verified organizations." |
*
* @param {Onboarding_Consent_Us_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_us_description = /** @type {((inputs?: Onboarding_Consent_Us_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Us_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_us_description(inputs)
	if (locale === "es") return es_onboarding_consent_us_description(inputs)
	if (locale === "de") return de_onboarding_consent_us_description(inputs)
	if (locale === "ar") return ar_onboarding_consent_us_description(inputs)
	if (locale === "fr") return fr_onboarding_consent_us_description(inputs)
	return ko_onboarding_consent_us_description(inputs)
});
export { onboarding_consent_us_description as "onboarding.consent.us.description" }