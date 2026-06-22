/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Submissionreceived3Inputs */

const en_developerportal_submissionform_submissionreceived3 = /** @type {(inputs: Developerportal_Submissionform_Submissionreceived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submission Received!`)
};

const es_developerportal_submissionform_submissionreceived3 = /** @type {(inputs: Developerportal_Submissionform_Submissionreceived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Recibido!`)
};

const fr_developerportal_submissionform_submissionreceived3 = /** @type {(inputs: Developerportal_Submissionform_Submissionreceived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soumission Reçue !`)
};

const ar_developerportal_submissionform_submissionreceived3 = /** @type {(inputs: Developerportal_Submissionform_Submissionreceived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم استلام الطلب!`)
};

/**
* | output |
* | --- |
* | "Submission Received!" |
*
* @param {Developerportal_Submissionform_Submissionreceived3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_submissionreceived3 = /** @type {((inputs?: Developerportal_Submissionform_Submissionreceived3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Submissionreceived3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_submissionreceived3(inputs)
	if (locale === "es") return es_developerportal_submissionform_submissionreceived3(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_submissionreceived3(inputs)
	return ar_developerportal_submissionform_submissionreceived3(inputs)
});
export { developerportal_submissionform_submissionreceived3 as "developerPortal.submissionForm.submissionReceived" }