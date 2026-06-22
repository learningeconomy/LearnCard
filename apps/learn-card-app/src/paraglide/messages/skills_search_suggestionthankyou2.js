/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Search_Suggestionthankyou2Inputs */

const en_skills_search_suggestionthankyou2 = /** @type {(inputs: Skills_Search_Suggestionthankyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Thank you for your suggestion!`)
};

const es_skills_search_suggestionthankyou2 = /** @type {(inputs: Skills_Search_Suggestionthankyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Gracias por tu sugerencia!`)
};

const fr_skills_search_suggestionthankyou2 = /** @type {(inputs: Skills_Search_Suggestionthankyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merci pour votre suggestion !`)
};

const ar_skills_search_suggestionthankyou2 = /** @type {(inputs: Skills_Search_Suggestionthankyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شكراً على اقتراحك!`)
};

/**
* | output |
* | --- |
* | "Thank you for your suggestion!" |
*
* @param {Skills_Search_Suggestionthankyou2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_search_suggestionthankyou2 = /** @type {((inputs?: Skills_Search_Suggestionthankyou2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Search_Suggestionthankyou2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_search_suggestionthankyou2(inputs)
	if (locale === "es") return es_skills_search_suggestionthankyou2(inputs)
	if (locale === "fr") return fr_skills_search_suggestionthankyou2(inputs)
	return ar_skills_search_suggestionthankyou2(inputs)
});
export { skills_search_suggestionthankyou2 as "skills.search.suggestionThankYou" }