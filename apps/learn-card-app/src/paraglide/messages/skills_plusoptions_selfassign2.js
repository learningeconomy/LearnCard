/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Plusoptions_Selfassign2Inputs */

const en_skills_plusoptions_selfassign2 = /** @type {(inputs: Skills_Plusoptions_Selfassign2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self Assign Skills`)
};

const es_skills_plusoptions_selfassign2 = /** @type {(inputs: Skills_Plusoptions_Selfassign2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoasignar habilidades`)
};

const fr_skills_plusoptions_selfassign2 = /** @type {(inputs: Skills_Plusoptions_Selfassign2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-attribuer des compétences`)
};

const ar_skills_plusoptions_selfassign2 = /** @type {(inputs: Skills_Plusoptions_Selfassign2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إسناد المهارات ذاتياً`)
};

/**
* | output |
* | --- |
* | "Self Assign Skills" |
*
* @param {Skills_Plusoptions_Selfassign2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_plusoptions_selfassign2 = /** @type {((inputs?: Skills_Plusoptions_Selfassign2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Plusoptions_Selfassign2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_plusoptions_selfassign2(inputs)
	if (locale === "es") return es_skills_plusoptions_selfassign2(inputs)
	if (locale === "fr") return fr_skills_plusoptions_selfassign2(inputs)
	return ar_skills_plusoptions_selfassign2(inputs)
});
export { skills_plusoptions_selfassign2 as "skills.plusOptions.selfAssign" }