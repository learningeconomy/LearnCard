/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Jobstability2Inputs */

const en_aiinsights_jobstability2 = /** @type {(inputs: Aiinsights_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Stability`)
};

const es_aiinsights_jobstability2 = /** @type {(inputs: Aiinsights_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estabilidad laboral`)
};

const fr_aiinsights_jobstability2 = /** @type {(inputs: Aiinsights_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stabilité de l'emploi`)
};

const ar_aiinsights_jobstability2 = /** @type {(inputs: Aiinsights_Jobstability2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استقرار الوظيفة`)
};

/**
* | output |
* | --- |
* | "Job Stability" |
*
* @param {Aiinsights_Jobstability2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_jobstability2 = /** @type {((inputs?: Aiinsights_Jobstability2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Jobstability2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_jobstability2(inputs)
	if (locale === "es") return es_aiinsights_jobstability2(inputs)
	if (locale === "fr") return fr_aiinsights_jobstability2(inputs)
	return ar_aiinsights_jobstability2(inputs)
});
export { aiinsights_jobstability2 as "aiInsights.jobStability" }