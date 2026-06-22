/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_SkillInputs */

const en_skills_skill = /** @type {(inputs: Skills_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill`)
};

const es_skills_skill = /** @type {(inputs: Skills_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad`)
};

const fr_skills_skill = /** @type {(inputs: Skills_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence`)
};

const ar_skills_skill = /** @type {(inputs: Skills_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة`)
};

/**
* | output |
* | --- |
* | "Skill" |
*
* @param {Skills_SkillInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_skill = /** @type {((inputs?: Skills_SkillInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_SkillInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_skill(inputs)
	if (locale === "es") return es_skills_skill(inputs)
	if (locale === "fr") return fr_skills_skill(inputs)
	return ar_skills_skill(inputs)
});
export { skills_skill as "skills.skill" }