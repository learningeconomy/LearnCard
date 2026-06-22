/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Steps_Launchtype_Title3Inputs */

const en_developerportal_submissionform_steps_launchtype_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Type`)
};

const es_developerportal_submissionform_steps_launchtype_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Launch Type]`)
};

const fr_developerportal_submissionform_steps_launchtype_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Launch Type]`)
};

const ar_developerportal_submissionform_steps_launchtype_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Launchtype_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Launch Type]`)
};

/**
* | output |
* | --- |
* | "Launch Type" |
*
* @param {Developerportal_Submissionform_Steps_Launchtype_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_steps_launchtype_title3 = /** @type {((inputs?: Developerportal_Submissionform_Steps_Launchtype_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Steps_Launchtype_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_steps_launchtype_title3(inputs)
	if (locale === "es") return es_developerportal_submissionform_steps_launchtype_title3(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_steps_launchtype_title3(inputs)
	return ar_developerportal_submissionform_steps_launchtype_title3(inputs)
});
export { developerportal_submissionform_steps_launchtype_title3 as "developerPortal.submissionForm.steps.launchType.title" }