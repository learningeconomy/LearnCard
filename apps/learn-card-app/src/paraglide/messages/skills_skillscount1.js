/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Skills_Skillscount1Inputs */

const en_skills_skillscount1 = /** @type {(inputs: Skills_Skillscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} skills`)
};

const es_skills_skillscount1 = /** @type {(inputs: Skills_Skillscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} habilidades`)
};

const fr_skills_skillscount1 = /** @type {(inputs: Skills_Skillscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} compétences`)
};

const ar_skills_skillscount1 = /** @type {(inputs: Skills_Skillscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} مهارة`)
};

/**
* | output |
* | --- |
* | "{count} skills" |
*
* @param {Skills_Skillscount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_skillscount1 = /** @type {((inputs: Skills_Skillscount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Skillscount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_skillscount1(inputs)
	if (locale === "es") return es_skills_skillscount1(inputs)
	if (locale === "fr") return fr_skills_skillscount1(inputs)
	return ar_skills_skillscount1(inputs)
});
export { skills_skillscount1 as "skills.skillsCount" }