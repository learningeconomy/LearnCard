/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Aisummaries1Inputs */

const en_category_aisummaries1 = /** @type {(inputs: Category_Aisummaries1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Summaries`)
};

const es_category_aisummaries1 = /** @type {(inputs: Category_Aisummaries1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resúmenes de IA`)
};

const fr_category_aisummaries1 = /** @type {(inputs: Category_Aisummaries1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumés IA`)
};

const ar_category_aisummaries1 = /** @type {(inputs: Category_Aisummaries1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخصات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Summaries" |
*
* @param {Category_Aisummaries1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_aisummaries1 = /** @type {((inputs?: Category_Aisummaries1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Aisummaries1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_aisummaries1(inputs)
	if (locale === "es") return es_category_aisummaries1(inputs)
	if (locale === "fr") return fr_category_aisummaries1(inputs)
	return ar_category_aisummaries1(inputs)
});
export { category_aisummaries1 as "category.aiSummaries" }