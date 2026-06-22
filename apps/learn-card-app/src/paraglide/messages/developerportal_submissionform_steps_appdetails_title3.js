/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Steps_Appdetails_Title3Inputs */

const en_developerportal_submissionform_steps_appdetails_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Appdetails_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Details`)
};

const es_developerportal_submissionform_steps_appdetails_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Appdetails_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[App Details]`)
};

const fr_developerportal_submissionform_steps_appdetails_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Appdetails_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[App Details]`)
};

const ar_developerportal_submissionform_steps_appdetails_title3 = /** @type {(inputs: Developerportal_Submissionform_Steps_Appdetails_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[App Details]`)
};

/**
* | output |
* | --- |
* | "App Details" |
*
* @param {Developerportal_Submissionform_Steps_Appdetails_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_steps_appdetails_title3 = /** @type {((inputs?: Developerportal_Submissionform_Steps_Appdetails_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Steps_Appdetails_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_steps_appdetails_title3(inputs)
	if (locale === "es") return es_developerportal_submissionform_steps_appdetails_title3(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_steps_appdetails_title3(inputs)
	return ar_developerportal_submissionform_steps_appdetails_title3(inputs)
});
export { developerportal_submissionform_steps_appdetails_title3 as "developerPortal.submissionForm.steps.appDetails.title" }