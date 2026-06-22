/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Levels_Expert_DescInputs */

const en_skills_proficiency_levels_expert_desc = /** @type {(inputs: Skills_Proficiency_Levels_Expert_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deep mastery; can lead and mentor others.`)
};

const es_skills_proficiency_levels_expert_desc = /** @type {(inputs: Skills_Proficiency_Levels_Expert_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dominio profundo; puede liderar y orientar a otros.`)
};

const fr_skills_proficiency_levels_expert_desc = /** @type {(inputs: Skills_Proficiency_Levels_Expert_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Maîtrise approfondie ; peut diriger et accompagner les autres.`)
};

const ar_skills_proficiency_levels_expert_desc = /** @type {(inputs: Skills_Proficiency_Levels_Expert_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إتقان عميق؛ قادر على القيادة وإرشاد الآخرين.`)
};

/**
* | output |
* | --- |
* | "Deep mastery; can lead and mentor others." |
*
* @param {Skills_Proficiency_Levels_Expert_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_levels_expert_desc = /** @type {((inputs?: Skills_Proficiency_Levels_Expert_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Levels_Expert_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_levels_expert_desc(inputs)
	if (locale === "es") return es_skills_proficiency_levels_expert_desc(inputs)
	if (locale === "fr") return fr_skills_proficiency_levels_expert_desc(inputs)
	return ar_skills_proficiency_levels_expert_desc(inputs)
});
export { skills_proficiency_levels_expert_desc as "skills.proficiency.levels.expert.desc" }