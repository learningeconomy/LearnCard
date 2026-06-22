/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Failedtosavedraft5Inputs */

const en_developerportal_submissionform_failedtosavedraft5 = /** @type {(inputs: Developerportal_Submissionform_Failedtosavedraft5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to save draft`)
};

const es_developerportal_submissionform_failedtosavedraft5 = /** @type {(inputs: Developerportal_Submissionform_Failedtosavedraft5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to save draft]`)
};

const fr_developerportal_submissionform_failedtosavedraft5 = /** @type {(inputs: Developerportal_Submissionform_Failedtosavedraft5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to save draft]`)
};

const ar_developerportal_submissionform_failedtosavedraft5 = /** @type {(inputs: Developerportal_Submissionform_Failedtosavedraft5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to save draft]`)
};

/**
* | output |
* | --- |
* | "Failed to save draft" |
*
* @param {Developerportal_Submissionform_Failedtosavedraft5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_failedtosavedraft5 = /** @type {((inputs?: Developerportal_Submissionform_Failedtosavedraft5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Failedtosavedraft5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_failedtosavedraft5(inputs)
	if (locale === "es") return es_developerportal_submissionform_failedtosavedraft5(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_failedtosavedraft5(inputs)
	return ar_developerportal_submissionform_failedtosavedraft5(inputs)
});
export { developerportal_submissionform_failedtosavedraft5 as "developerPortal.submissionForm.failedToSaveDraft" }