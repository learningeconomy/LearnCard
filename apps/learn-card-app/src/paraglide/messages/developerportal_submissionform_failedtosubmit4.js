/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Failedtosubmit4Inputs */

const en_developerportal_submissionform_failedtosubmit4 = /** @type {(inputs: Developerportal_Submissionform_Failedtosubmit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to submit listing`)
};

const es_developerportal_submissionform_failedtosubmit4 = /** @type {(inputs: Developerportal_Submissionform_Failedtosubmit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to submit listing]`)
};

const fr_developerportal_submissionform_failedtosubmit4 = /** @type {(inputs: Developerportal_Submissionform_Failedtosubmit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to submit listing]`)
};

const ar_developerportal_submissionform_failedtosubmit4 = /** @type {(inputs: Developerportal_Submissionform_Failedtosubmit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to submit listing]`)
};

/**
* | output |
* | --- |
* | "Failed to submit listing" |
*
* @param {Developerportal_Submissionform_Failedtosubmit4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_failedtosubmit4 = /** @type {((inputs?: Developerportal_Submissionform_Failedtosubmit4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Failedtosubmit4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_failedtosubmit4(inputs)
	if (locale === "es") return es_developerportal_submissionform_failedtosubmit4(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_failedtosubmit4(inputs)
	return ar_developerportal_submissionform_failedtosubmit4(inputs)
});
export { developerportal_submissionform_failedtosubmit4 as "developerPortal.submissionForm.failedToSubmit" }