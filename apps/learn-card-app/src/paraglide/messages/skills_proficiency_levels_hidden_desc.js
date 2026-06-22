/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Levels_Hidden_DescInputs */

const en_skills_proficiency_levels_hidden_desc = /** @type {(inputs: Skills_Proficiency_Levels_Hidden_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Do not display my proficiency status.`)
};

const es_skills_proficiency_levels_hidden_desc = /** @type {(inputs: Skills_Proficiency_Levels_Hidden_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No mostrar mi nivel de competencia.`)
};

const fr_skills_proficiency_levels_hidden_desc = /** @type {(inputs: Skills_Proficiency_Levels_Hidden_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ne pas afficher mon niveau de compétence.`)
};

const ar_skills_proficiency_levels_hidden_desc = /** @type {(inputs: Skills_Proficiency_Levels_Hidden_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عدم عرض مستوى كفاءتي.`)
};

/**
* | output |
* | --- |
* | "Do not display my proficiency status." |
*
* @param {Skills_Proficiency_Levels_Hidden_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_levels_hidden_desc = /** @type {((inputs?: Skills_Proficiency_Levels_Hidden_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Levels_Hidden_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_levels_hidden_desc(inputs)
	if (locale === "es") return es_skills_proficiency_levels_hidden_desc(inputs)
	if (locale === "fr") return fr_skills_proficiency_levels_hidden_desc(inputs)
	return ar_skills_proficiency_levels_hidden_desc(inputs)
});
export { skills_proficiency_levels_hidden_desc as "skills.proficiency.levels.hidden.desc" }