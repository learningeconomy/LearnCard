/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Teacher_DescriptionInputs */

const en_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I'm an educator working directly with learners.`)
};

const es_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soy un educador trabajando directamente con estudiantes.`)
};

const de_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ich bin ein Pädagoge, der direkt mit Lernenden arbeitet.`)
};

const ar_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا معلم أعمل مباشرة مع المتعلمين.`)
};

const fr_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis un éducateur travaillant directement avec des apprenants.`)
};

const ko_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습자와 직접 일하는 교육자입니다.`)
};

/**
* | output |
* | --- |
* | "I'm an educator working directly with learners." |
*
* @param {Onboarding_Role_Teacher_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_teacher_description = /** @type {((inputs?: Onboarding_Role_Teacher_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Teacher_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_teacher_description(inputs)
	if (locale === "es") return es_onboarding_role_teacher_description(inputs)
	if (locale === "de") return de_onboarding_role_teacher_description(inputs)
	if (locale === "ar") return ar_onboarding_role_teacher_description(inputs)
	if (locale === "fr") return fr_onboarding_role_teacher_description(inputs)
	return ko_onboarding_role_teacher_description(inputs)
});
export { onboarding_role_teacher_description as "onboarding.role.teacher.description" }