/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Teacher_TitleInputs */

const en_onboarding_role_teacher_title = /** @type {(inputs: Onboarding_Role_Teacher_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teacher`)
};

const es_onboarding_role_teacher_title = /** @type {(inputs: Onboarding_Role_Teacher_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profesor`)
};

const de_onboarding_role_teacher_title = /** @type {(inputs: Onboarding_Role_Teacher_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lehrer`)
};

const ar_onboarding_role_teacher_title = /** @type {(inputs: Onboarding_Role_Teacher_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معلم`)
};

const fr_onboarding_role_teacher_title = /** @type {(inputs: Onboarding_Role_Teacher_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enseignant`)
};

const ko_onboarding_role_teacher_title = /** @type {(inputs: Onboarding_Role_Teacher_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`교사`)
};

/**
* | output |
* | --- |
* | "Teacher" |
*
* @param {Onboarding_Role_Teacher_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_teacher_title = /** @type {((inputs?: Onboarding_Role_Teacher_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Teacher_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_teacher_title(inputs)
	if (locale === "es") return es_onboarding_role_teacher_title(inputs)
	if (locale === "de") return de_onboarding_role_teacher_title(inputs)
	if (locale === "ar") return ar_onboarding_role_teacher_title(inputs)
	if (locale === "fr") return fr_onboarding_role_teacher_title(inputs)
	return ko_onboarding_role_teacher_title(inputs)
});
export { onboarding_role_teacher_title as "onboarding.role.teacher.title" }