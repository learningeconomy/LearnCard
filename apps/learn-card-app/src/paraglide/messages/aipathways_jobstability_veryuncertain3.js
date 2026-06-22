/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Jobstability_Veryuncertain3Inputs */

const en_aipathways_jobstability_veryuncertain3 = /** @type {(inputs: Aipathways_Jobstability_Veryuncertain3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Very Uncertain`)
};

const es_aipathways_jobstability_veryuncertain3 = /** @type {(inputs: Aipathways_Jobstability_Veryuncertain3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Muy Incierto`)
};

const fr_aipathways_jobstability_veryuncertain3 = /** @type {(inputs: Aipathways_Jobstability_Veryuncertain3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Très incertain`)
};

const ar_aipathways_jobstability_veryuncertain3 = /** @type {(inputs: Aipathways_Jobstability_Veryuncertain3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير مؤكد جدًا`)
};

/**
* | output |
* | --- |
* | "Very Uncertain" |
*
* @param {Aipathways_Jobstability_Veryuncertain3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_jobstability_veryuncertain3 = /** @type {((inputs?: Aipathways_Jobstability_Veryuncertain3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Jobstability_Veryuncertain3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_jobstability_veryuncertain3(inputs)
	if (locale === "es") return es_aipathways_jobstability_veryuncertain3(inputs)
	if (locale === "fr") return fr_aipathways_jobstability_veryuncertain3(inputs)
	return ar_aipathways_jobstability_veryuncertain3(inputs)
});
export { aipathways_jobstability_veryuncertain3 as "aiPathways.jobStability.veryUncertain" }