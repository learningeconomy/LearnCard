/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Counselor_DescriptionInputs */

const en_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I support learners in planning their educational or career paths.`)
};

const es_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apoyo a estudiantes en la planificación de sus trayectorias educativas o profesionales.`)
};

const de_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ich unterstütze Lernende bei der Planung ihrer Bildungs- oder Karrierewege.`)
};

const ar_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدعم المتعلمين في تخطيط مساراتهم التعليمية أو المهنية.`)
};

const fr_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je soutiens les apprenants dans la planification de leurs parcours éducatifs ou professionnels.`)
};

const ko_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습자의 교육 또는 진로 경로 계획을 지원합니다.`)
};

/**
* | output |
* | --- |
* | "I support learners in planning their educational or career paths." |
*
* @param {Onboarding_Role_Counselor_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_counselor_description = /** @type {((inputs?: Onboarding_Role_Counselor_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Counselor_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_counselor_description(inputs)
	if (locale === "es") return es_onboarding_role_counselor_description(inputs)
	if (locale === "de") return de_onboarding_role_counselor_description(inputs)
	if (locale === "ar") return ar_onboarding_role_counselor_description(inputs)
	if (locale === "fr") return fr_onboarding_role_counselor_description(inputs)
	return ko_onboarding_role_counselor_description(inputs)
});
export { onboarding_role_counselor_description as "onboarding.role.counselor.description" }