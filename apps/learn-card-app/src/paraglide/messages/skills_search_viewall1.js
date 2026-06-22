/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Viewall1Inputs */

const en_skills_search_viewall1 = /** @type {(inputs: Skills_Search_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View All`)
};

const es_skills_search_viewall1 = /** @type {(inputs: Skills_Search_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver todo`)
};

const fr_skills_search_viewall1 = /** @type {(inputs: Skills_Search_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout voir`)
};

const ar_skills_search_viewall1 = /** @type {(inputs: Skills_Search_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الكل`)
};

/**
* | output |
* | --- |
* | "View All" |
*
* @param {Skills_Search_Viewall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_viewall1 = /** @type {((inputs?: Skills_Search_Viewall1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Viewall1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_viewall1(inputs)
	if (locale === "es") return es_skills_search_viewall1(inputs)
	if (locale === "fr") return fr_skills_search_viewall1(inputs)
	return ar_skills_search_viewall1(inputs)
});
export { skills_search_viewall1 as "skills.search.viewAll" }