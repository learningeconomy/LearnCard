/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Levels_Beginner_DescInputs */

const en_skills_proficiency_levels_beginner_desc = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handles simple tasks without support.`)
};

const es_skills_proficiency_levels_beginner_desc = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Realiza tareas simples sin ayuda.`)
};

const fr_skills_proficiency_levels_beginner_desc = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gère des tâches simples sans aide.`)
};

const ar_skills_proficiency_levels_beginner_desc = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ينجز المهام البسيطة دون مساعدة.`)
};

/**
* | output |
* | --- |
* | "Handles simple tasks without support." |
*
* @param {Skills_Proficiency_Levels_Beginner_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_levels_beginner_desc = /** @type {((inputs?: Skills_Proficiency_Levels_Beginner_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Levels_Beginner_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_levels_beginner_desc(inputs)
	if (locale === "es") return es_skills_proficiency_levels_beginner_desc(inputs)
	if (locale === "fr") return fr_skills_proficiency_levels_beginner_desc(inputs)
	return ar_skills_proficiency_levels_beginner_desc(inputs)
});
export { skills_proficiency_levels_beginner_desc as "skills.proficiency.levels.beginner.desc" }