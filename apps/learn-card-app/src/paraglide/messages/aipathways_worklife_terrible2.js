/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Worklife_Terrible2Inputs */

const en_aipathways_worklife_terrible2 = /** @type {(inputs: Aipathways_Worklife_Terrible2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terrible, Unfair`)
};

const es_aipathways_worklife_terrible2 = /** @type {(inputs: Aipathways_Worklife_Terrible2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Es Terrible`)
};

const fr_aipathways_worklife_terrible2 = /** @type {(inputs: Aipathways_Worklife_Terrible2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est terrible`)
};

const ar_aipathways_worklife_terrible2 = /** @type {(inputs: Aipathways_Worklife_Terrible2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه فظيع`)
};

/**
* | output |
* | --- |
* | "Terrible, Unfair" |
*
* @param {Aipathways_Worklife_Terrible2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_worklife_terrible2 = /** @type {((inputs?: Aipathways_Worklife_Terrible2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Worklife_Terrible2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_worklife_terrible2(inputs)
	if (locale === "es") return es_aipathways_worklife_terrible2(inputs)
	if (locale === "fr") return fr_aipathways_worklife_terrible2(inputs)
	return ar_aipathways_worklife_terrible2(inputs)
});
export { aipathways_worklife_terrible2 as "aiPathways.workLife.terrible" }