/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Levels_Advanced_DescInputs */

const en_skills_proficiency_levels_advanced_desc = /** @type {(inputs: Skills_Proficiency_Levels_Advanced_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solves complex tasks efficiently.`)
};

const es_skills_proficiency_levels_advanced_desc = /** @type {(inputs: Skills_Proficiency_Levels_Advanced_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resuelve tareas complejas con eficiencia.`)
};

const fr_skills_proficiency_levels_advanced_desc = /** @type {(inputs: Skills_Proficiency_Levels_Advanced_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résout efficacement des tâches complexes.`)
};

const ar_skills_proficiency_levels_advanced_desc = /** @type {(inputs: Skills_Proficiency_Levels_Advanced_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحل المهام المعقدة بكفاءة.`)
};

/**
* | output |
* | --- |
* | "Solves complex tasks efficiently." |
*
* @param {Skills_Proficiency_Levels_Advanced_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_levels_advanced_desc = /** @type {((inputs?: Skills_Proficiency_Levels_Advanced_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Levels_Advanced_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_levels_advanced_desc(inputs)
	if (locale === "es") return es_skills_proficiency_levels_advanced_desc(inputs)
	if (locale === "fr") return fr_skills_proficiency_levels_advanced_desc(inputs)
	return ar_skills_proficiency_levels_advanced_desc(inputs)
});
export { skills_proficiency_levels_advanced_desc as "skills.proficiency.levels.advanced.desc" }