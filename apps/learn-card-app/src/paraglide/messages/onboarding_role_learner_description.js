/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Learner_DescriptionInputs */

const en_onboarding_role_learner_description = /** @type {(inputs: Onboarding_Role_Learner_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I'm a student building my profile and tracking my progress.`)
};

const es_onboarding_role_learner_description = /** @type {(inputs: Onboarding_Role_Learner_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soy un estudiante construyendo mi perfil y siguiendo mi progreso.`)
};

const de_onboarding_role_learner_description = /** @type {(inputs: Onboarding_Role_Learner_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ich bin ein Schüler und baue mein Profil auf und verfolge meinen Fortschritt.`)
};

const ar_onboarding_role_learner_description = /** @type {(inputs: Onboarding_Role_Learner_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا طالب أقوم ببناء ملفي الشخصي وتتبع تقدمي.`)
};

const fr_onboarding_role_learner_description = /** @type {(inputs: Onboarding_Role_Learner_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis un étudiant qui construit son profil et suit sa progression.`)
};

const ko_onboarding_role_learner_description = /** @type {(inputs: Onboarding_Role_Learner_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필을 구축하고 진행 상황을 추적하는 학생입니다.`)
};

/**
* | output |
* | --- |
* | "I'm a student building my profile and tracking my progress." |
*
* @param {Onboarding_Role_Learner_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_learner_description = /** @type {((inputs?: Onboarding_Role_Learner_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Learner_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_learner_description(inputs)
	if (locale === "es") return es_onboarding_role_learner_description(inputs)
	if (locale === "de") return de_onboarding_role_learner_description(inputs)
	if (locale === "ar") return ar_onboarding_role_learner_description(inputs)
	if (locale === "fr") return fr_onboarding_role_learner_description(inputs)
	return ko_onboarding_role_learner_description(inputs)
});
export { onboarding_role_learner_description as "onboarding.role.learner.description" }