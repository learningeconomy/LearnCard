/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Suggestskillhelp2Inputs */

const en_skills_search_suggestskillhelp2 = /** @type {(inputs: Skills_Search_Suggestskillhelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We are always adding new skills and your suggestions help!`)
};

const es_skills_search_suggestskillhelp2 = /** @type {(inputs: Skills_Search_Suggestskillhelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Siempre estamos añadiendo nuevas habilidades y tus sugerencias ayudan!`)
};

const fr_skills_search_suggestskillhelp2 = /** @type {(inputs: Skills_Search_Suggestskillhelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous ajoutons constamment de nouvelles compétences et vos suggestions nous aident !`)
};

const ar_skills_search_suggestskillhelp2 = /** @type {(inputs: Skills_Search_Suggestskillhelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نضيف دائماً مهارات جديدة واقتراحاتك تساعدنا!`)
};

/**
* | output |
* | --- |
* | "We are always adding new skills and your suggestions help!" |
*
* @param {Skills_Search_Suggestskillhelp2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_suggestskillhelp2 = /** @type {((inputs?: Skills_Search_Suggestskillhelp2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Suggestskillhelp2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_suggestskillhelp2(inputs)
	if (locale === "es") return es_skills_search_suggestskillhelp2(inputs)
	if (locale === "fr") return fr_skills_search_suggestskillhelp2(inputs)
	return ar_skills_search_suggestskillhelp2(inputs)
});
export { skills_search_suggestskillhelp2 as "skills.search.suggestSkillHelp" }