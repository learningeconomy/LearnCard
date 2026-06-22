/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Currentjob2Inputs */

const en_aipathways_currentjob2 = /** @type {(inputs: Aipathways_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Current Job`)
};

const es_aipathways_currentjob2 = /** @type {(inputs: Aipathways_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trabajo actual`)
};

const fr_aipathways_currentjob2 = /** @type {(inputs: Aipathways_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emploi actuel`)
};

const ar_aipathways_currentjob2 = /** @type {(inputs: Aipathways_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوظيفة الحالية`)
};

/**
* | output |
* | --- |
* | "Current Job" |
*
* @param {Aipathways_Currentjob2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_currentjob2 = /** @type {((inputs?: Aipathways_Currentjob2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Currentjob2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_currentjob2(inputs)
	if (locale === "es") return es_aipathways_currentjob2(inputs)
	if (locale === "fr") return fr_aipathways_currentjob2(inputs)
	return ar_aipathways_currentjob2(inputs)
});
export { aipathways_currentjob2 as "aiPathways.currentJob" }