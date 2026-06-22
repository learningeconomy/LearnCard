/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Jobsummary2Inputs */

const en_skillprofile_step2_jobsummary2 = /** @type {(inputs: Skillprofile_Step2_Jobsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Summary`)
};

const es_skillprofile_step2_jobsummary2 = /** @type {(inputs: Skillprofile_Step2_Jobsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen del puesto`)
};

const fr_skillprofile_step2_jobsummary2 = /** @type {(inputs: Skillprofile_Step2_Jobsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé du poste`)
};

const ar_skillprofile_step2_jobsummary2 = /** @type {(inputs: Skillprofile_Step2_Jobsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخص الوظيفة`)
};

/**
* | output |
* | --- |
* | "Job Summary" |
*
* @param {Skillprofile_Step2_Jobsummary2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_jobsummary2 = /** @type {((inputs?: Skillprofile_Step2_Jobsummary2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Jobsummary2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_jobsummary2(inputs)
	if (locale === "es") return es_skillprofile_step2_jobsummary2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_jobsummary2(inputs)
	return ar_skillprofile_step2_jobsummary2(inputs)
});
export { skillprofile_step2_jobsummary2 as "skillProfile.step2.jobSummary" }