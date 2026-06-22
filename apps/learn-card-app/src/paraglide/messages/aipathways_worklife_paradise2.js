/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Worklife_Paradise2Inputs */

const en_aipathways_worklife_paradise2 = /** @type {(inputs: Aipathways_Worklife_Paradise2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It's Paradise`)
};

const es_aipathways_worklife_paradise2 = /** @type {(inputs: Aipathways_Worklife_Paradise2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Es el Paraíso`)
};

const fr_aipathways_worklife_paradise2 = /** @type {(inputs: Aipathways_Worklife_Paradise2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est le paradis`)
};

const ar_aipathways_worklife_paradise2 = /** @type {(inputs: Aipathways_Worklife_Paradise2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه الجنة`)
};

/**
* | output |
* | --- |
* | "It's Paradise" |
*
* @param {Aipathways_Worklife_Paradise2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_worklife_paradise2 = /** @type {((inputs?: Aipathways_Worklife_Paradise2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Worklife_Paradise2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_worklife_paradise2(inputs)
	if (locale === "es") return es_aipathways_worklife_paradise2(inputs)
	if (locale === "fr") return fr_aipathways_worklife_paradise2(inputs)
	return ar_aipathways_worklife_paradise2(inputs)
});
export { aipathways_worklife_paradise2 as "aiPathways.workLife.paradise" }