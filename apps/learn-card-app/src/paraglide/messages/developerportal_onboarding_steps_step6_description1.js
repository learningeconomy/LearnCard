/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Steps_Step6_Description1Inputs */

const en_developerportal_onboarding_steps_step6_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Map your data to credentials`)
};

const es_developerportal_onboarding_steps_step6_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mapa tus datos a credenciales`)
};

const fr_developerportal_onboarding_steps_step6_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mappez vos données aux credentials`)
};

const ar_developerportal_onboarding_steps_step6_description1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطيط بياناتك إلى بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Map your data to credentials" |
*
* @param {Developerportal_Onboarding_Steps_Step6_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_steps_step6_description1 = /** @type {((inputs?: Developerportal_Onboarding_Steps_Step6_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Steps_Step6_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_steps_step6_description1(inputs)
	if (locale === "es") return es_developerportal_onboarding_steps_step6_description1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_steps_step6_description1(inputs)
	return ar_developerportal_onboarding_steps_step6_description1(inputs)
});
export { developerportal_onboarding_steps_step6_description1 as "developerPortal.onboarding.steps.step6.description" }