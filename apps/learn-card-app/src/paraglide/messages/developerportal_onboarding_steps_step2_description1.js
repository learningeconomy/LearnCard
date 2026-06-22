/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Steps_Step2_Description1Inputs */

const en_developerportal_onboarding_steps_step2_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step2_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up credential signing`)
};

const es_developerportal_onboarding_steps_step2_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step2_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura la firma de credenciales`)
};

const fr_developerportal_onboarding_steps_step2_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step2_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez la signature des credentials`)
};

const ar_developerportal_onboarding_steps_step2_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step2_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد توقيع بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Set up credential signing" |
*
* @param {Developerportal_Onboarding_Steps_Step2_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_steps_step2_description1 = /** @type {((inputs?: Developerportal_Onboarding_Steps_Step2_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Steps_Step2_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_steps_step2_description1(inputs)
	if (locale === "es") return es_developerportal_onboarding_steps_step2_description1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_steps_step2_description1(inputs)
	return ar_developerportal_onboarding_steps_step2_description1(inputs)
});
export { developerportal_onboarding_steps_step2_description1 as "developerPortal.onboarding.steps.step2.description" }