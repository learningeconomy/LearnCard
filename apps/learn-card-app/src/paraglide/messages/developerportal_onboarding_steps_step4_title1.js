/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Steps_Step4_Title1Inputs */

const en_developerportal_onboarding_steps_step4_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step4_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Templates`)
};

const es_developerportal_onboarding_steps_step4_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step4_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantillas`)
};

const fr_developerportal_onboarding_steps_step4_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step4_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèles`)
};

const ar_developerportal_onboarding_steps_step4_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step4_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`القوالب`)
};

/**
* | output |
* | --- |
* | "Templates" |
*
* @param {Developerportal_Onboarding_Steps_Step4_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_steps_step4_title1 = /** @type {((inputs?: Developerportal_Onboarding_Steps_Step4_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Steps_Step4_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_steps_step4_title1(inputs)
	if (locale === "es") return es_developerportal_onboarding_steps_step4_title1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_steps_step4_title1(inputs)
	return ar_developerportal_onboarding_steps_step4_title1(inputs)
});
export { developerportal_onboarding_steps_step4_title1 as "developerPortal.onboarding.steps.step4.title" }