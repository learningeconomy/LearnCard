/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Steps_Step6_Title1Inputs */

const en_developerportal_onboarding_steps_step6_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Data Mapping`)
};

const es_developerportal_onboarding_steps_step6_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mapeo de Datos`)
};

const fr_developerportal_onboarding_steps_step6_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mapping de Données`)
};

const ar_developerportal_onboarding_steps_step6_title1 = /** @type {(inputs: Developerportal_Onboarding_Steps_Step6_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطيط البيانات`)
};

/**
* | output |
* | --- |
* | "Data Mapping" |
*
* @param {Developerportal_Onboarding_Steps_Step6_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_steps_step6_title1 = /** @type {((inputs?: Developerportal_Onboarding_Steps_Step6_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Steps_Step6_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_steps_step6_title1(inputs)
	if (locale === "es") return es_developerportal_onboarding_steps_step6_title1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_steps_step6_title1(inputs)
	return ar_developerportal_onboarding_steps_step6_title1(inputs)
});
export { developerportal_onboarding_steps_step6_title1 as "developerPortal.onboarding.steps.step6.title" }