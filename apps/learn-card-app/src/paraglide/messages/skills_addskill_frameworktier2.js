/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Addskill_Frameworktier2Inputs */

const en_skills_addskill_frameworktier2 = /** @type {(inputs: Skills_Addskill_Frameworktier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tier`)
};

const es_skills_addskill_frameworktier2 = /** @type {(inputs: Skills_Addskill_Frameworktier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nivel del marco`)
};

const fr_skills_addskill_frameworktier2 = /** @type {(inputs: Skills_Addskill_Frameworktier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveau du référentiel`)
};

const ar_skills_addskill_frameworktier2 = /** @type {(inputs: Skills_Addskill_Frameworktier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستوى الإطار`)
};

/**
* | output |
* | --- |
* | "Framework Tier" |
*
* @param {Skills_Addskill_Frameworktier2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_addskill_frameworktier2 = /** @type {((inputs?: Skills_Addskill_Frameworktier2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Addskill_Frameworktier2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_addskill_frameworktier2(inputs)
	if (locale === "es") return es_skills_addskill_frameworktier2(inputs)
	if (locale === "fr") return fr_skills_addskill_frameworktier2(inputs)
	return ar_skills_addskill_frameworktier2(inputs)
});
export { skills_addskill_frameworktier2 as "skills.addSkill.frameworkTier" }