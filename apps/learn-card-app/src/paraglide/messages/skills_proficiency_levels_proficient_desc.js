/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Levels_Proficient_DescInputs */

const en_skills_proficiency_levels_proficient_desc = /** @type {(inputs: Skills_Proficiency_Levels_Proficient_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Works independently on routine tasks.`)
};

const es_skills_proficiency_levels_proficient_desc = /** @type {(inputs: Skills_Proficiency_Levels_Proficient_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trabaja de forma independiente en tareas habituales.`)
};

const fr_skills_proficiency_levels_proficient_desc = /** @type {(inputs: Skills_Proficiency_Levels_Proficient_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Travaille de façon autonome sur les tâches courantes.`)
};

const ar_skills_proficiency_levels_proficient_desc = /** @type {(inputs: Skills_Proficiency_Levels_Proficient_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يعمل باستقلالية في المهام الروتينية.`)
};

/**
* | output |
* | --- |
* | "Works independently on routine tasks." |
*
* @param {Skills_Proficiency_Levels_Proficient_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_levels_proficient_desc = /** @type {((inputs?: Skills_Proficiency_Levels_Proficient_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Levels_Proficient_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_levels_proficient_desc(inputs)
	if (locale === "es") return es_skills_proficiency_levels_proficient_desc(inputs)
	if (locale === "fr") return fr_skills_proficiency_levels_proficient_desc(inputs)
	return ar_skills_proficiency_levels_proficient_desc(inputs)
});
export { skills_proficiency_levels_proficient_desc as "skills.proficiency.levels.proficient.desc" }