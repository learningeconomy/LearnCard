/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Worklife_Average2Inputs */

const en_aipathways_worklife_average2 = /** @type {(inputs: Aipathways_Worklife_Average2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Average`)
};

const es_aipathways_worklife_average2 = /** @type {(inputs: Aipathways_Worklife_Average2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Es Promedio`)
};

const fr_aipathways_worklife_average2 = /** @type {(inputs: Aipathways_Worklife_Average2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est moyen`)
};

const ar_aipathways_worklife_average2 = /** @type {(inputs: Aipathways_Worklife_Average2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه متوسط`)
};

/**
* | output |
* | --- |
* | "Average" |
*
* @param {Aipathways_Worklife_Average2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_worklife_average2 = /** @type {((inputs?: Aipathways_Worklife_Average2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Worklife_Average2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_worklife_average2(inputs)
	if (locale === "es") return es_aipathways_worklife_average2(inputs)
	if (locale === "fr") return fr_aipathways_worklife_average2(inputs)
	return ar_aipathways_worklife_average2(inputs)
});
export { aipathways_worklife_average2 as "aiPathways.workLife.average" }