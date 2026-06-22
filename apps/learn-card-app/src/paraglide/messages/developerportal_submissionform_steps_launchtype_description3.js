/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Steps_Launchtype_Description3Inputs */

const en_developerportal_submissionform_steps_launchtype_description3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How your app integrates`)
};

const es_developerportal_submissionform_steps_launchtype_description3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[How your app integrates]`)
};

const fr_developerportal_submissionform_steps_launchtype_description3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[How your app integrates]`)
};

const ar_developerportal_submissionform_steps_launchtype_description3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[How your app integrates]`)
};

/**
* | output |
* | --- |
* | "How your app integrates" |
*
* @param {Developerportal_Submissionform_Steps_Launchtype_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_steps_launchtype_description3 = /** @type {((inputs?: Developerportal_Submissionform_Steps_Launchtype_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Steps_Launchtype_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_steps_launchtype_description3(inputs)
	if (locale === "es") return es_developerportal_submissionform_steps_launchtype_description3(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_steps_launchtype_description3(inputs)
	return ar_developerportal_submissionform_steps_launchtype_description3(inputs)
});
export { developerportal_submissionform_steps_launchtype_description3 as "developerPortal.submissionForm.steps.launchType.description" }