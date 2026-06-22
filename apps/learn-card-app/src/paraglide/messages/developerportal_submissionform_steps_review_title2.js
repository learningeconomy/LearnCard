/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Steps_Review_Title2Inputs */

const en_developerportal_submissionform_steps_review_title2 = /** @type {(inputs: Developerportal_Submissionform_Steps_Review_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review`)
};

const es_developerportal_submissionform_steps_review_title2 = /** @type {(inputs: Developerportal_Submissionform_Steps_Review_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Review]`)
};

const fr_developerportal_submissionform_steps_review_title2 = /** @type {(inputs: Developerportal_Submissionform_Steps_Review_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Review]`)
};

const ar_developerportal_submissionform_steps_review_title2 = /** @type {(inputs: Developerportal_Submissionform_Steps_Review_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Review]`)
};

/**
* | output |
* | --- |
* | "Review" |
*
* @param {Developerportal_Submissionform_Steps_Review_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_steps_review_title2 = /** @type {((inputs?: Developerportal_Submissionform_Steps_Review_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Steps_Review_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_steps_review_title2(inputs)
	if (locale === "es") return es_developerportal_submissionform_steps_review_title2(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_steps_review_title2(inputs)
	return ar_developerportal_submissionform_steps_review_title2(inputs)
});
export { developerportal_submissionform_steps_review_title2 as "developerPortal.submissionForm.steps.review.title" }