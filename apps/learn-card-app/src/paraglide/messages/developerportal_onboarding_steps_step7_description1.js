/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Steps_Step7_Description1Inputs */

const en_developerportal_onboarding_steps_step7_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step7_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test your integration`)
};

const es_developerportal_onboarding_steps_step7_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step7_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prueba tu integración`)
};

const fr_developerportal_onboarding_steps_step7_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step7_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Testez votre intégration`)
};

const ar_developerportal_onboarding_steps_step7_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step7_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار التكامل الخاص بك`)
};

/**
* | output |
* | --- |
* | "Test your integration" |
*
* @param {Developerportal_Onboarding_Steps_Step7_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_steps_step7_description1 = /** @type {((inputs?: Developerportal_Onboarding_Steps_Step7_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Steps_Step7_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_steps_step7_description1(inputs)
	if (locale === "es") return es_developerportal_onboarding_steps_step7_description1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_steps_step7_description1(inputs)
	return ar_developerportal_onboarding_steps_step7_description1(inputs)
});
export { developerportal_onboarding_steps_step7_description1 as "developerPortal.onboarding.steps.step7.description" }