/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Framework_Searchplaceholder1Inputs */

const en_skills_framework_searchplaceholder1 = /** @type {(inputs: Skills_Framework_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search framework...`)
};

const es_skills_framework_searchplaceholder1 = /** @type {(inputs: Skills_Framework_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar marco...`)
};

const fr_skills_framework_searchplaceholder1 = /** @type {(inputs: Skills_Framework_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher un référentiel...`)
};

const ar_skills_framework_searchplaceholder1 = /** @type {(inputs: Skills_Framework_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث في الإطار...`)
};

/**
* | output |
* | --- |
* | "Search framework..." |
*
* @param {Skills_Framework_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_framework_searchplaceholder1 = /** @type {((inputs?: Skills_Framework_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Framework_Searchplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_framework_searchplaceholder1(inputs)
	if (locale === "es") return es_skills_framework_searchplaceholder1(inputs)
	if (locale === "fr") return fr_skills_framework_searchplaceholder1(inputs)
	return ar_skills_framework_searchplaceholder1(inputs)
});
export { skills_framework_searchplaceholder1 as "skills.framework.searchPlaceholder" }