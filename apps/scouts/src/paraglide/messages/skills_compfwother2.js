/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Compfwother2Inputs */

const en_skills_compfwother2 = /** @type {(inputs: Skills_Compfwother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Competency Frameworks`)
};

const es_skills_compfwother2 = /** @type {(inputs: Skills_Compfwother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Marcos de Competencias`)
};

const fr_skills_compfwother2 = /** @type {(inputs: Skills_Compfwother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} cadres de compétences`)
};

const ar_skills_compfwother2 = /** @type {(inputs: Skills_Compfwother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Competency Frameworks`)
};

/**
* | output |
* | --- |
* | "{count} Competency Frameworks" |
*
* @param {Skills_Compfwother2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_compfwother2 = /** @type {((inputs?: Skills_Compfwother2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Compfwother2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_compfwother2(inputs)
	if (locale === "es") return es_skills_compfwother2(inputs)
	if (locale === "fr") return fr_skills_compfwother2(inputs)
	return ar_skills_compfwother2(inputs)
});
export { skills_compfwother2 as "skills.compFwOther" }