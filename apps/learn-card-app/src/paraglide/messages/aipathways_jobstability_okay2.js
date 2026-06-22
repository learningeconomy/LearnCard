/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Jobstability_Okay2Inputs */

const en_aipathways_jobstability_okay2 = /** @type {(inputs: Aipathways_Jobstability_Okay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It's Okay`)
};

const es_aipathways_jobstability_okay2 = /** @type {(inputs: Aipathways_Jobstability_Okay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Está Bien`)
};

const fr_aipathways_jobstability_okay2 = /** @type {(inputs: Aipathways_Jobstability_Okay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ça va`)
};

const ar_aipathways_jobstability_okay2 = /** @type {(inputs: Aipathways_Jobstability_Okay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه مقبول`)
};

/**
* | output |
* | --- |
* | "It's Okay" |
*
* @param {Aipathways_Jobstability_Okay2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_jobstability_okay2 = /** @type {((inputs?: Aipathways_Jobstability_Okay2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Jobstability_Okay2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_jobstability_okay2(inputs)
	if (locale === "es") return es_aipathways_jobstability_okay2(inputs)
	if (locale === "fr") return fr_aipathways_jobstability_okay2(inputs)
	return ar_aipathways_jobstability_okay2(inputs)
});
export { aipathways_jobstability_okay2 as "aiPathways.jobStability.okay" }