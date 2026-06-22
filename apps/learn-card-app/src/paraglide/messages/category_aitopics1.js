/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Aitopics1Inputs */

const en_category_aitopics1 = /** @type {(inputs: Category_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Topics`)
};

const es_category_aitopics1 = /** @type {(inputs: Category_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Temas de IA`)
};

const fr_category_aitopics1 = /** @type {(inputs: Category_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sujets IA`)
};

const ar_category_aitopics1 = /** @type {(inputs: Category_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مواضيع الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Topics" |
*
* @param {Category_Aitopics1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_aitopics1 = /** @type {((inputs?: Category_Aitopics1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Aitopics1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_aitopics1(inputs)
	if (locale === "es") return es_category_aitopics1(inputs)
	if (locale === "fr") return fr_category_aitopics1(inputs)
	return ar_category_aitopics1(inputs)
});
export { category_aitopics1 as "category.aiTopics" }