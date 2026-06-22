/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Proficiency_Skilllevelprefix2Inputs */

const en_skills_proficiency_skilllevelprefix2 = /** @type {(inputs: Skills_Proficiency_Skilllevelprefix2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill Level`)
};

const es_skills_proficiency_skilllevelprefix2 = /** @type {(inputs: Skills_Proficiency_Skilllevelprefix2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nivel de habilidad`)
};

const fr_skills_proficiency_skilllevelprefix2 = /** @type {(inputs: Skills_Proficiency_Skilllevelprefix2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveau de compétence`)
};

const ar_skills_proficiency_skilllevelprefix2 = /** @type {(inputs: Skills_Proficiency_Skilllevelprefix2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستوى المهارة`)
};

/**
* | output |
* | --- |
* | "Skill Level" |
*
* @param {Skills_Proficiency_Skilllevelprefix2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_proficiency_skilllevelprefix2 = /** @type {((inputs?: Skills_Proficiency_Skilllevelprefix2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Proficiency_Skilllevelprefix2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_proficiency_skilllevelprefix2(inputs)
	if (locale === "es") return es_skills_proficiency_skilllevelprefix2(inputs)
	if (locale === "fr") return fr_skills_proficiency_skilllevelprefix2(inputs)
	return ar_skills_proficiency_skilllevelprefix2(inputs)
});
export { skills_proficiency_skilllevelprefix2 as "skills.proficiency.skillLevelPrefix" }