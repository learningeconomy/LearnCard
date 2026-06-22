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

const fr_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je soutiens les apprenants dans la planification de leurs parcours éducatifs ou professionnels.`)
};

const ar_onboarding_role_counselor_description = /** @type {(inputs: Onboarding_Role_Counselor_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدعم المتعلمين في تخطيط مساراتهم التعليمية أو المهنية.`)
};

/**
* | output |
* | --- |
* | "I support learners in planning their educational or career paths." |
*
* @param {Onboarding_Role_Counselor_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_role_counselor_description = /** @type {((inputs?: Onboarding_Role_Counselor_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Counselor_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_counselor_description(inputs)
	if (locale === "es") return es_onboarding_role_counselor_description(inputs)
	if (locale === "fr") return fr_onboarding_role_counselor_description(inputs)
	return ar_onboarding_role_counselor_description(inputs)
});
export { onboarding_role_counselor_description as "onboarding.role.counselor.description" }