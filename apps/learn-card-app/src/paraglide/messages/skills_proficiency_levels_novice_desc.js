/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Levels_Novice_DescInputs */

const en_skills_proficiency_levels_novice_desc = /** @type {(inputs: Skills_Proficiency_Levels_Novice_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Just starting and needs guidance.`)
};

const es_skills_proficiency_levels_novice_desc = /** @type {(inputs: Skills_Proficiency_Levels_Novice_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recién empieza y necesita orientación.`)
};

const fr_skills_proficiency_levels_novice_desc = /** @type {(inputs: Skills_Proficiency_Levels_Novice_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Débute et a besoin d'accompagnement.`)
};

const ar_skills_proficiency_levels_novice_desc = /** @type {(inputs: Skills_Proficiency_Levels_Novice_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`في البداية ويحتاج إلى توجيه.`)
};

/**
* | output |
* | --- |
* | "Just starting and needs guidance." |
*
* @param {Skills_Proficiency_Levels_Novice_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_levels_novice_desc = /** @type {((inputs?: Skills_Proficiency_Levels_Novice_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Levels_Novice_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_levels_novice_desc(inputs)
	if (locale === "es") return es_skills_proficiency_levels_novice_desc(inputs)
	if (locale === "fr") return fr_skills_proficiency_levels_novice_desc(inputs)
	return ar_skills_proficiency_levels_novice_desc(inputs)
});
export { skills_proficiency_levels_novice_desc as "skills.proficiency.levels.novice.desc" }