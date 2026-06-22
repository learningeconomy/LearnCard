/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Jobstability_Great2Inputs */

const en_aipathways_jobstability_great2 = /** @type {(inputs: Aipathways_Jobstability_Great2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Great`)
};

const es_aipathways_jobstability_great2 = /** @type {(inputs: Aipathways_Jobstability_Great2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Está Genial`)
};

const fr_aipathways_jobstability_great2 = /** @type {(inputs: Aipathways_Jobstability_Great2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est super`)
};

const ar_aipathways_jobstability_great2 = /** @type {(inputs: Aipathways_Jobstability_Great2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه رائع`)
};

/**
* | output |
* | --- |
* | "Great" |
*
* @param {Aipathways_Jobstability_Great2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_jobstability_great2 = /** @type {((inputs?: Aipathways_Jobstability_Great2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Jobstability_Great2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_jobstability_great2(inputs)
	if (locale === "es") return es_aipathways_jobstability_great2(inputs)
	if (locale === "fr") return fr_aipathways_jobstability_great2(inputs)
	return ar_aipathways_jobstability_great2(inputs)
});
export { aipathways_jobstability_great2 as "aiPathways.jobStability.great" }