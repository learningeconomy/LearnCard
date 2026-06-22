/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Searchskillgoaljob4Inputs */

const en_aipathways_searchskillgoaljob4 = /** @type {(inputs: Aipathways_Searchskillgoaljob4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search by skill, goal, or job...`)
};

const es_aipathways_searchskillgoaljob4 = /** @type {(inputs: Aipathways_Searchskillgoaljob4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar por habilidad, objetivo o trabajo...`)
};

const fr_aipathways_searchskillgoaljob4 = /** @type {(inputs: Aipathways_Searchskillgoaljob4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher par compétence, objectif ou métier...`)
};

const ar_aipathways_searchskillgoaljob4 = /** @type {(inputs: Aipathways_Searchskillgoaljob4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...البحث بالمهارة أو الهدف أو الوظيفة`)
};

/**
* | output |
* | --- |
* | "Search by skill, goal, or job..." |
*
* @param {Aipathways_Searchskillgoaljob4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_searchskillgoaljob4 = /** @type {((inputs?: Aipathways_Searchskillgoaljob4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Searchskillgoaljob4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_searchskillgoaljob4(inputs)
	if (locale === "es") return es_aipathways_searchskillgoaljob4(inputs)
	if (locale === "fr") return fr_aipathways_searchskillgoaljob4(inputs)
	return ar_aipathways_searchskillgoaljob4(inputs)
});
export { aipathways_searchskillgoaljob4 as "aiPathways.searchSkillGoalJob" }