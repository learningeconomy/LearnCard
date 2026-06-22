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

const fr_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis un éducateur travaillant directement avec des apprenants.`)
};

const ar_onboarding_role_teacher_description = /** @type {(inputs: Onboarding_Role_Teacher_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا معلم أعمل مباشرة مع المتعلمين.`)
};

/**
* | output |
* | --- |
* | "I'm an educator working directly with learners." |
*
* @param {Onboarding_Role_Teacher_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_role_teacher_description = /** @type {((inputs?: Onboarding_Role_Teacher_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Teacher_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_teacher_description(inputs)
	if (locale === "es") return es_onboarding_role_teacher_description(inputs)
	if (locale === "fr") return fr_onboarding_role_teacher_description(inputs)
	return ar_onboarding_role_teacher_description(inputs)
});
export { onboarding_role_teacher_description as "onboarding.role.teacher.description" }