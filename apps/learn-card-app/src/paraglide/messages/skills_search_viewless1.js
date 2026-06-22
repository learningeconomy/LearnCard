/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Viewless1Inputs */

const en_skills_search_viewless1 = /** @type {(inputs: Skills_Search_Viewless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Less`)
};

const es_skills_search_viewless1 = /** @type {(inputs: Skills_Search_Viewless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver menos`)
};

const fr_skills_search_viewless1 = /** @type {(inputs: Skills_Search_Viewless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir moins`)
};

const ar_skills_search_viewless1 = /** @type {(inputs: Skills_Search_Viewless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض أقل`)
};

/**
* | output |
* | --- |
* | "View Less" |
*
* @param {Skills_Search_Viewless1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_viewless1 = /** @type {((inputs?: Skills_Search_Viewless1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Viewless1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_viewless1(inputs)
	if (locale === "es") return es_skills_search_viewless1(inputs)
	if (locale === "fr") return fr_skills_search_viewless1(inputs)
	return ar_skills_search_viewless1(inputs)
});
export { skills_search_viewless1 as "skills.search.viewLess" }