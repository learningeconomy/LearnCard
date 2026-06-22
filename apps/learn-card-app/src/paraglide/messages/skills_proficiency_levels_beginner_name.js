/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Levels_Beginner_NameInputs */

const en_skills_proficiency_levels_beginner_name = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beginner`)
};

const es_skills_proficiency_levels_beginner_name = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Principiante`)
};

const fr_skills_proficiency_levels_beginner_name = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Débutant`)
};

const ar_skills_proficiency_levels_beginner_name = /** @type {(inputs: Skills_Proficiency_Levels_Beginner_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مبتدئ`)
};

/**
* | output |
* | --- |
* | "Beginner" |
*
* @param {Skills_Proficiency_Levels_Beginner_NameInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_levels_beginner_name = /** @type {((inputs?: Skills_Proficiency_Levels_Beginner_NameInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Levels_Beginner_NameInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_levels_beginner_name(inputs)
	if (locale === "es") return es_skills_proficiency_levels_beginner_name(inputs)
	if (locale === "fr") return fr_skills_proficiency_levels_beginner_name(inputs)
	return ar_skills_proficiency_levels_beginner_name(inputs)
});
export { skills_proficiency_levels_beginner_name as "skills.proficiency.levels.beginner.name" }