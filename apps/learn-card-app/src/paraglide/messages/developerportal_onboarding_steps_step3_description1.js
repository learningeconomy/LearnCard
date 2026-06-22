/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Steps_Step3_Description1Inputs */

const en_developerportal_onboarding_steps_step3_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Customize your credential appearance`)
};

const es_developerportal_onboarding_steps_step3_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personaliza la apariencia de tus credenciales`)
};

const fr_developerportal_onboarding_steps_step3_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisez l'apparence de vos credentials`)
};

const ar_developerportal_onboarding_steps_step3_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص مظهر بيانات الاعتماد الخاصة بك`)
};

/**
* | output |
* | --- |
* | "Customize your credential appearance" |
*
* @param {Developerportal_Onboarding_Steps_Step3_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_steps_step3_description1 = /** @type {((inputs?: Developerportal_Onboarding_Steps_Step3_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Steps_Step3_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_steps_step3_description1(inputs)
	if (locale === "es") return es_developerportal_onboarding_steps_step3_description1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_steps_step3_description1(inputs)
	return ar_developerportal_onboarding_steps_step3_description1(inputs)
});
export { developerportal_onboarding_steps_step3_description1 as "developerPortal.onboarding.steps.step3.description" }