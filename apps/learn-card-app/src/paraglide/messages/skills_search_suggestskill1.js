/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Suggestskill1Inputs */

const en_skills_search_suggestskill1 = /** @type {(inputs: Skills_Search_Suggestskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suggest Skill`)
};

const es_skills_search_suggestskill1 = /** @type {(inputs: Skills_Search_Suggestskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sugerir habilidad`)
};

const fr_skills_search_suggestskill1 = /** @type {(inputs: Skills_Search_Suggestskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suggérer une compétence`)
};

const ar_skills_search_suggestskill1 = /** @type {(inputs: Skills_Search_Suggestskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اقترح مهارة`)
};

/**
* | output |
* | --- |
* | "Suggest Skill" |
*
* @param {Skills_Search_Suggestskill1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_suggestskill1 = /** @type {((inputs?: Skills_Search_Suggestskill1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Suggestskill1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_suggestskill1(inputs)
	if (locale === "es") return es_skills_search_suggestskill1(inputs)
	if (locale === "fr") return fr_skills_search_suggestskill1(inputs)
	return ar_skills_search_suggestskill1(inputs)
});
export { skills_search_suggestskill1 as "skills.search.suggestSkill" }