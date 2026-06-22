/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Noresultsorsuggestions3Inputs */

const en_skills_search_noresultsorsuggestions3 = /** @type {(inputs: Skills_Search_Noresultsorsuggestions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results or suggestions`)
};

const es_skills_search_noresultsorsuggestions3 = /** @type {(inputs: Skills_Search_Noresultsorsuggestions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados ni sugerencias`)
};

const fr_skills_search_noresultsorsuggestions3 = /** @type {(inputs: Skills_Search_Noresultsorsuggestions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat ni suggestion`)
};

const ar_skills_search_noresultsorsuggestions3 = /** @type {(inputs: Skills_Search_Noresultsorsuggestions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج أو اقتراحات`)
};

/**
* | output |
* | --- |
* | "No results or suggestions" |
*
* @param {Skills_Search_Noresultsorsuggestions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_noresultsorsuggestions3 = /** @type {((inputs?: Skills_Search_Noresultsorsuggestions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Noresultsorsuggestions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_noresultsorsuggestions3(inputs)
	if (locale === "es") return es_skills_search_noresultsorsuggestions3(inputs)
	if (locale === "fr") return fr_skills_search_noresultsorsuggestions3(inputs)
	return ar_skills_search_noresultsorsuggestions3(inputs)
});
export { skills_search_noresultsorsuggestions3 as "skills.search.noResultsOrSuggestions" }