/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Learner_TitleInputs */

const en_onboarding_role_learner_title = /** @type {(inputs: Onboarding_Role_Learner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learner`)
};

const es_onboarding_role_learner_title = /** @type {(inputs: Onboarding_Role_Learner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estudiante`)
};

const de_onboarding_role_learner_title = /** @type {(inputs: Onboarding_Role_Learner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lernender`)
};

const ar_onboarding_role_learner_title = /** @type {(inputs: Onboarding_Role_Learner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متعلم`)
};

const fr_onboarding_role_learner_title = /** @type {(inputs: Onboarding_Role_Learner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apprenant`)
};

const ko_onboarding_role_learner_title = /** @type {(inputs: Onboarding_Role_Learner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습자`)
};

/**
* | output |
* | --- |
* | "Learner" |
*
* @param {Onboarding_Role_Learner_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_learner_title = /** @type {((inputs?: Onboarding_Role_Learner_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Learner_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_learner_title(inputs)
	if (locale === "es") return es_onboarding_role_learner_title(inputs)
	if (locale === "de") return de_onboarding_role_learner_title(inputs)
	if (locale === "ar") return ar_onboarding_role_learner_title(inputs)
	if (locale === "fr") return fr_onboarding_role_learner_title(inputs)
	return ko_onboarding_role_learner_title(inputs)
});
export { onboarding_role_learner_title as "onboarding.role.learner.title" }