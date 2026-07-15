/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Compfwone2Inputs */

const en_skills_compfwone2 = /** @type {(inputs: Skills_Compfwone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 Competency Framework`)
};

const es_skills_compfwone2 = /** @type {(inputs: Skills_Compfwone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 Marco de Competencias`)
};

const fr_skills_compfwone2 = /** @type {(inputs: Skills_Compfwone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 cadre de compétences`)
};

const ar_skills_compfwone2 = /** @type {(inputs: Skills_Compfwone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إطار كفاءات واحد`)
};

/**
* | output |
* | --- |
* | "1 Competency Framework" |
*
* @param {Skills_Compfwone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_compfwone2 = /** @type {((inputs?: Skills_Compfwone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Compfwone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_compfwone2(inputs)
	if (locale === "es") return es_skills_compfwone2(inputs)
	if (locale === "fr") return fr_skills_compfwone2(inputs)
	return ar_skills_compfwone2(inputs)
});
export { skills_compfwone2 as "skills.compFwOne" }