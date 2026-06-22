/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Aiassessments1Inputs */

const en_category_aiassessments1 = /** @type {(inputs: Category_Aiassessments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Assessments`)
};

const es_category_aiassessments1 = /** @type {(inputs: Category_Aiassessments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evaluaciones de IA`)
};

const fr_category_aiassessments1 = /** @type {(inputs: Category_Aiassessments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Évaluations IA`)
};

const ar_category_aiassessments1 = /** @type {(inputs: Category_Aiassessments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقييمات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Assessments" |
*
* @param {Category_Aiassessments1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_aiassessments1 = /** @type {((inputs?: Category_Aiassessments1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Aiassessments1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_aiassessments1(inputs)
	if (locale === "es") return es_category_aiassessments1(inputs)
	if (locale === "fr") return fr_category_aiassessments1(inputs)
	return ar_category_aiassessments1(inputs)
});
export { category_aiassessments1 as "category.aiAssessments" }