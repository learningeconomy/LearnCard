/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Searchplaceholder1Inputs */

const en_skills_search_searchplaceholder1 = /** @type {(inputs: Skills_Search_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search by skill, goal, or job...`)
};

const es_skills_search_searchplaceholder1 = /** @type {(inputs: Skills_Search_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar por habilidad, objetivo o empleo...`)
};

const fr_skills_search_searchplaceholder1 = /** @type {(inputs: Skills_Search_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher par compétence, objectif ou emploi...`)
};

const ar_skills_search_searchplaceholder1 = /** @type {(inputs: Skills_Search_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابحث حسب المهارة أو الهدف أو الوظيفة...`)
};

/**
* | output |
* | --- |
* | "Search by skill, goal, or job..." |
*
* @param {Skills_Search_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_searchplaceholder1 = /** @type {((inputs?: Skills_Search_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Searchplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_searchplaceholder1(inputs)
	if (locale === "es") return es_skills_search_searchplaceholder1(inputs)
	if (locale === "fr") return fr_skills_search_searchplaceholder1(inputs)
	return ar_skills_search_searchplaceholder1(inputs)
});
export { skills_search_searchplaceholder1 as "skills.search.searchPlaceholder" }