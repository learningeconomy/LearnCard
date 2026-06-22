/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Jobstability_Poor2Inputs */

const en_aipathways_jobstability_poor2 = /** @type {(inputs: Aipathways_Jobstability_Poor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Poor`)
};

const es_aipathways_jobstability_poor2 = /** @type {(inputs: Aipathways_Jobstability_Poor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Es Pobre`)
};

const fr_aipathways_jobstability_poor2 = /** @type {(inputs: Aipathways_Jobstability_Poor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est mauvais`)
};

const ar_aipathways_jobstability_poor2 = /** @type {(inputs: Aipathways_Jobstability_Poor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه ضعيف`)
};

/**
* | output |
* | --- |
* | "Poor" |
*
* @param {Aipathways_Jobstability_Poor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_jobstability_poor2 = /** @type {((inputs?: Aipathways_Jobstability_Poor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Jobstability_Poor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_jobstability_poor2(inputs)
	if (locale === "es") return es_aipathways_jobstability_poor2(inputs)
	if (locale === "fr") return fr_aipathways_jobstability_poor2(inputs)
	return ar_aipathways_jobstability_poor2(inputs)
});
export { aipathways_jobstability_poor2 as "aiPathways.jobStability.poor" }