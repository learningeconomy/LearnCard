/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Jobstability2Inputs */

const en_aipathways_jobstability2 = /** @type {(inputs: Aipathways_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Stability`)
};

const es_aipathways_jobstability2 = /** @type {(inputs: Aipathways_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estabilidad laboral`)
};

const fr_aipathways_jobstability2 = /** @type {(inputs: Aipathways_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stabilité de l'emploi`)
};

const ar_aipathways_jobstability2 = /** @type {(inputs: Aipathways_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استقرار الوظيفة`)
};

/**
* | output |
* | --- |
* | "Job Stability" |
*
* @param {Aipathways_Jobstability2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_jobstability2 = /** @type {((inputs?: Aipathways_Jobstability2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Jobstability2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_jobstability2(inputs)
	if (locale === "es") return es_aipathways_jobstability2(inputs)
	if (locale === "fr") return fr_aipathways_jobstability2(inputs)
	return ar_aipathways_jobstability2(inputs)
});
export { aipathways_jobstability2 as "aiPathways.jobStability" }