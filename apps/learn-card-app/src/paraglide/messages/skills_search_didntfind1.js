/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Didntfind1Inputs */

const en_skills_search_didntfind1 = /** @type {(inputs: Skills_Search_Didntfind1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Didn't find what you're looking for?`)
};

const es_skills_search_didntfind1 = /** @type {(inputs: Skills_Search_Didntfind1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿No encontraste lo que buscabas?`)
};

const fr_skills_search_didntfind1 = /** @type {(inputs: Skills_Search_Didntfind1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas trouvé ce que vous cherchiez ?`)
};

const ar_skills_search_didntfind1 = /** @type {(inputs: Skills_Search_Didntfind1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تجد ما تبحث عنه؟`)
};

/**
* | output |
* | --- |
* | "Didn't find what you're looking for?" |
*
* @param {Skills_Search_Didntfind1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_didntfind1 = /** @type {((inputs?: Skills_Search_Didntfind1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Didntfind1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_didntfind1(inputs)
	if (locale === "es") return es_skills_search_didntfind1(inputs)
	if (locale === "fr") return fr_skills_search_didntfind1(inputs)
	return ar_skills_search_didntfind1(inputs)
});
export { skills_search_didntfind1 as "skills.search.didntFind" }