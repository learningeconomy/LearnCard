/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Matchingskill2Inputs */

const en_aipathways_matchingskill2 = /** @type {(inputs: Aipathways_Matchingskill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Matching Skill`)
};

const es_aipathways_matchingskill2 = /** @type {(inputs: Aipathways_Matchingskill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad coincidente`)
};

const fr_aipathways_matchingskill2 = /** @type {(inputs: Aipathways_Matchingskill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence correspondante`)
};

const ar_aipathways_matchingskill2 = /** @type {(inputs: Aipathways_Matchingskill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة مطابقة`)
};

/**
* | output |
* | --- |
* | "Matching Skill" |
*
* @param {Aipathways_Matchingskill2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_matchingskill2 = /** @type {((inputs?: Aipathways_Matchingskill2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Matchingskill2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_matchingskill2(inputs)
	if (locale === "es") return es_aipathways_matchingskill2(inputs)
	if (locale === "fr") return fr_aipathways_matchingskill2(inputs)
	return ar_aipathways_matchingskill2(inputs)
});
export { aipathways_matchingskill2 as "aiPathways.matchingSkill" }