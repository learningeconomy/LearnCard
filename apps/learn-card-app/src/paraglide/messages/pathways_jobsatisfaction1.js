/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Jobsatisfaction1Inputs */

const en_pathways_jobsatisfaction1 = /** @type {(inputs: Pathways_Jobsatisfaction1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Satisfaction`)
};

const es_pathways_jobsatisfaction1 = /** @type {(inputs: Pathways_Jobsatisfaction1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Satisfacción laboral`)
};

const fr_pathways_jobsatisfaction1 = /** @type {(inputs: Pathways_Jobsatisfaction1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Satisfaction au travail`)
};

const ar_pathways_jobsatisfaction1 = /** @type {(inputs: Pathways_Jobsatisfaction1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرضا الوظيفي`)
};

/**
* | output |
* | --- |
* | "Job Satisfaction" |
*
* @param {Pathways_Jobsatisfaction1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_jobsatisfaction1 = /** @type {((inputs?: Pathways_Jobsatisfaction1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Jobsatisfaction1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_jobsatisfaction1(inputs)
	if (locale === "es") return es_pathways_jobsatisfaction1(inputs)
	if (locale === "fr") return fr_pathways_jobsatisfaction1(inputs)
	return ar_pathways_jobsatisfaction1(inputs)
});
export { pathways_jobsatisfaction1 as "pathways.jobSatisfaction" }