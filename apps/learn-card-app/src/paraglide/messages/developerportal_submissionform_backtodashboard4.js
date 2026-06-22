/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Backtodashboard4Inputs */

const en_developerportal_submissionform_backtodashboard4 = /** @type {(inputs: Developerportal_Submissionform_Backtodashboard4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back to Dashboard`)
};

const es_developerportal_submissionform_backtodashboard4 = /** @type {(inputs: Developerportal_Submissionform_Backtodashboard4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver al Panel`)
};

const fr_developerportal_submissionform_backtodashboard4 = /** @type {(inputs: Developerportal_Submissionform_Backtodashboard4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour au Tableau de Bord`)
};

const ar_developerportal_submissionform_backtodashboard4 = /** @type {(inputs: Developerportal_Submissionform_Backtodashboard4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى لوحة التحكم`)
};

/**
* | output |
* | --- |
* | "Back to Dashboard" |
*
* @param {Developerportal_Submissionform_Backtodashboard4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_backtodashboard4 = /** @type {((inputs?: Developerportal_Submissionform_Backtodashboard4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Backtodashboard4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_backtodashboard4(inputs)
	if (locale === "es") return es_developerportal_submissionform_backtodashboard4(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_backtodashboard4(inputs)
	return ar_developerportal_submissionform_backtodashboard4(inputs)
});
export { developerportal_submissionform_backtodashboard4 as "developerPortal.submissionForm.backToDashboard" }