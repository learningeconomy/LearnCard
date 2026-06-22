/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Skills_Addskillscount2Inputs */

const en_skills_addskillscount2 = /** @type {(inputs: Skills_Addskillscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Add ${i?.count} Skills`)
};

const es_skills_addskillscount2 = /** @type {(inputs: Skills_Addskillscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Añadir ${i?.count} habilidades`)
};

const fr_skills_addskillscount2 = /** @type {(inputs: Skills_Addskillscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ajouter ${i?.count} compétences`)
};

const ar_skills_addskillscount2 = /** @type {(inputs: Skills_Addskillscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إضافة ${i?.count} مهارة`)
};

/**
* | output |
* | --- |
* | "Add {count} Skills" |
*
* @param {Skills_Addskillscount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_addskillscount2 = /** @type {((inputs: Skills_Addskillscount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Addskillscount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_addskillscount2(inputs)
	if (locale === "es") return es_skills_addskillscount2(inputs)
	if (locale === "fr") return fr_skills_addskillscount2(inputs)
	return ar_skills_addskillscount2(inputs)
});
export { skills_addskillscount2 as "skills.addSkillsCount" }