/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Jobstability_Confident2Inputs */

const en_aipathways_jobstability_confident2 = /** @type {(inputs: Aipathways_Jobstability_Confident2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confident`)
};

const es_aipathways_jobstability_confident2 = /** @type {(inputs: Aipathways_Jobstability_Confident2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estoy Confiado`)
};

const fr_aipathways_jobstability_confident2 = /** @type {(inputs: Aipathways_Jobstability_Confident2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis confiant`)
};

const ar_aipathways_jobstability_confident2 = /** @type {(inputs: Aipathways_Jobstability_Confident2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا واثق`)
};

/**
* | output |
* | --- |
* | "Confident" |
*
* @param {Aipathways_Jobstability_Confident2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_jobstability_confident2 = /** @type {((inputs?: Aipathways_Jobstability_Confident2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Jobstability_Confident2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_jobstability_confident2(inputs)
	if (locale === "es") return es_aipathways_jobstability_confident2(inputs)
	if (locale === "fr") return fr_aipathways_jobstability_confident2(inputs)
	return ar_aipathways_jobstability_confident2(inputs)
});
export { aipathways_jobstability_confident2 as "aiPathways.jobStability.confident" }