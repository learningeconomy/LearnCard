/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_CountInputs */

const en_skills_count = /** @type {(inputs: Skills_CountInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_skills_count = /** @type {(inputs: Skills_CountInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const fr_skills_count = /** @type {(inputs: Skills_CountInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ar_skills_count = /** @type {(inputs: Skills_CountInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Skills_CountInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_count = /** @type {((inputs?: Skills_CountInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_CountInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_count(inputs)
	if (locale === "es") return es_skills_count(inputs)
	if (locale === "fr") return fr_skills_count(inputs)
	return ar_skills_count(inputs)
});
export { skills_count as "skills.count" }