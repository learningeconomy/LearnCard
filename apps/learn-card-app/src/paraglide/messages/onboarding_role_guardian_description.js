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

const fr_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis un parent ou tuteur qui soutient un apprenant.`)
};

const ar_onboarding_role_guardian_description = /** @type {(inputs: Onboarding_Role_Guardian_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا والد أو ولي أمر أدعم متعلماً.`)
};

/**
* | output |
* | --- |
* | "I'm a parent or guardian supporting a learner." |
*
* @param {Onboarding_Role_Guardian_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_role_guardian_description = /** @type {((inputs?: Onboarding_Role_Guardian_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Guardian_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_guardian_description(inputs)
	if (locale === "es") return es_onboarding_role_guardian_description(inputs)
	if (locale === "fr") return fr_onboarding_role_guardian_description(inputs)
	return ar_onboarding_role_guardian_description(inputs)
});
export { onboarding_role_guardian_description as "onboarding.role.guardian.description" }