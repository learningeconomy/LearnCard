/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Submitanotherapp4Inputs */

const en_developerportal_submissionform_submitanotherapp4 = /** @type {(inputs: Developerportal_Submissionform_Submitanotherapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submit Another App`)
};

const es_developerportal_submissionform_submitanotherapp4 = /** @type {(inputs: Developerportal_Submissionform_Submitanotherapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Otra App`)
};

const fr_developerportal_submissionform_submitanotherapp4 = /** @type {(inputs: Developerportal_Submissionform_Submitanotherapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soumettre une Autre App`)
};

const ar_developerportal_submissionform_submitanotherapp4 = /** @type {(inputs: Developerportal_Submissionform_Submitanotherapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقديم تطبيق آخر`)
};

/**
* | output |
* | --- |
* | "Submit Another App" |
*
* @param {Developerportal_Submissionform_Submitanotherapp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_submitanotherapp4 = /** @type {((inputs?: Developerportal_Submissionform_Submitanotherapp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Submitanotherapp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_submitanotherapp4(inputs)
	if (locale === "es") return es_developerportal_submissionform_submitanotherapp4(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_submitanotherapp4(inputs)
	return ar_developerportal_submissionform_submitanotherapp4(inputs)
});
export { developerportal_submissionform_submitanotherapp4 as "developerPortal.submissionForm.submitAnotherApp" }