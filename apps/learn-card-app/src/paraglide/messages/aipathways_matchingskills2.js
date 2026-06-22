/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Matchingskills2Inputs */

const en_aipathways_matchingskills2 = /** @type {(inputs: Aipathways_Matchingskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Matching Skills`)
};

const es_aipathways_matchingskills2 = /** @type {(inputs: Aipathways_Matchingskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades coincidentes`)
};

const fr_aipathways_matchingskills2 = /** @type {(inputs: Aipathways_Matchingskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences correspondantes`)
};

const ar_aipathways_matchingskills2 = /** @type {(inputs: Aipathways_Matchingskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارات مطابقة`)
};

/**
* | output |
* | --- |
* | "Matching Skills" |
*
* @param {Aipathways_Matchingskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_matchingskills2 = /** @type {((inputs?: Aipathways_Matchingskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Matchingskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_matchingskills2(inputs)
	if (locale === "es") return es_aipathways_matchingskills2(inputs)
	if (locale === "fr") return fr_aipathways_matchingskills2(inputs)
	return ar_aipathways_matchingskills2(inputs)
});
export { aipathways_matchingskills2 as "aiPathways.matchingSkills" }