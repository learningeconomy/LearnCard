/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Guardian_DescriptionInputs */

const en_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I'm a parent or guardian supporting a learner.`)
};

const es_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soy padre, madre o tutor apoyando a un estudiante.`)
};

const de_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ich bin ein Elternteil oder Erziehungsberechtigter, der einen Lernenden unterstützt.`)
};

const ar_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا والد أو ولي أمر أدعم متعلماً.`)
};

const fr_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis un parent ou tuteur qui soutient un apprenant.`)
};

const ko_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습자를 지원하는 부모 또는 보호자입니다.`)
};

/**
* | output |
* | --- |
* | "I'm a parent or guardian supporting a learner." |
*
* @param {Onboarding_Role_Guardian_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_guardian_description = /** @type {((inputs?: Onboarding_Role_Guardian_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Guardian_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_guardian_description(inputs)
	if (locale === "es") return es_onboarding_role_guardian_description(inputs)
	if (locale === "de") return de_onboarding_role_guardian_description(inputs)
	if (locale === "ar") return ar_onboarding_role_guardian_description(inputs)
	if (locale === "fr") return fr_onboarding_role_guardian_description(inputs)
	return ko_onboarding_role_guardian_description(inputs)
});
export { onboarding_role_guardian_description as "onboarding.role.guardian.description" }