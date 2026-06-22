/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Selfattested1Inputs */

const en_skills_proficiency_selfattested1 = /** @type {(inputs: Skills_Proficiency_Selfattested1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self Attested Skill Level -`)
};

const es_skills_proficiency_selfattested1 = /** @type {(inputs: Skills_Proficiency_Selfattested1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nivel de habilidad autoevaluado -`)
};

const fr_skills_proficiency_selfattested1 = /** @type {(inputs: Skills_Proficiency_Selfattested1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveau de compétence auto-déclaré -`)
};

const ar_skills_proficiency_selfattested1 = /** @type {(inputs: Skills_Proficiency_Selfattested1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستوى المهارة المُقَرّ ذاتياً -`)
};

/**
* | output |
* | --- |
* | "Self Attested Skill Level -" |
*
* @param {Skills_Proficiency_Selfattested1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_selfattested1 = /** @type {((inputs?: Skills_Proficiency_Selfattested1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Selfattested1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_selfattested1(inputs)
	if (locale === "es") return es_skills_proficiency_selfattested1(inputs)
	if (locale === "fr") return fr_skills_proficiency_selfattested1(inputs)
	return ar_skills_proficiency_selfattested1(inputs)
});
export { skills_proficiency_selfattested1 as "skills.proficiency.selfAttested" }