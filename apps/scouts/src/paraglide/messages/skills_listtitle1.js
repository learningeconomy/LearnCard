/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Listtitle1Inputs */

const en_skills_listtitle1 = /** @type {(inputs: Skills_Listtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const es_skills_listtitle1 = /** @type {(inputs: Skills_Listtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const fr_skills_listtitle1 = /** @type {(inputs: Skills_Listtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const ar_skills_listtitle1 = /** @type {(inputs: Skills_Listtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

/**
* | output |
* | --- |
* | "Boosts" |
*
* @param {Skills_Listtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_listtitle1 = /** @type {((inputs?: Skills_Listtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Listtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_listtitle1(inputs)
	if (locale === "es") return es_skills_listtitle1(inputs)
	if (locale === "fr") return fr_skills_listtitle1(inputs)
	return ar_skills_listtitle1(inputs)
});
export { skills_listtitle1 as "skills.listTitle" }