/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Addskill_Details1Inputs */

const en_skills_addskill_details1 = /** @type {(inputs: Skills_Addskill_Details1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const es_skills_addskill_details1 = /** @type {(inputs: Skills_Addskill_Details1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles`)
};

const fr_skills_addskill_details1 = /** @type {(inputs: Skills_Addskill_Details1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails`)
};

const ar_skills_addskill_details1 = /** @type {(inputs: Skills_Addskill_Details1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التفاصيل`)
};

/**
* | output |
* | --- |
* | "Details" |
*
* @param {Skills_Addskill_Details1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_addskill_details1 = /** @type {((inputs?: Skills_Addskill_Details1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Addskill_Details1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_addskill_details1(inputs)
	if (locale === "es") return es_skills_addskill_details1(inputs)
	if (locale === "fr") return fr_skills_addskill_details1(inputs)
	return ar_skills_addskill_details1(inputs)
});
export { skills_addskill_details1 as "skills.addSkill.details" }