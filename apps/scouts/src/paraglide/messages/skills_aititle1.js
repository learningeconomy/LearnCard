/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Aititle1Inputs */

const en_skills_aititle1 = /** @type {(inputs: Skills_Aititle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Insights`)
};

const es_skills_aititle1 = /** @type {(inputs: Skills_Aititle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Información de IA`)
};

const fr_skills_aititle1 = /** @type {(inputs: Skills_Aititle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Informations IA`)
};

const ar_skills_aititle1 = /** @type {(inputs: Skills_Aititle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤى الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Insights" |
*
* @param {Skills_Aititle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_aititle1 = /** @type {((inputs?: Skills_Aititle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Aititle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_aititle1(inputs)
	if (locale === "es") return es_skills_aititle1(inputs)
	if (locale === "fr") return fr_skills_aititle1(inputs)
	return ar_skills_aititle1(inputs)
});
export { skills_aititle1 as "skills.aiTitle" }