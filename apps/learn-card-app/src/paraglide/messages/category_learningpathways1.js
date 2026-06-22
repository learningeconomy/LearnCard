/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Learningpathways1Inputs */

const en_category_learningpathways1 = /** @type {(inputs: Category_Learningpathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning Pathways`)
};

const es_category_learningpathways1 = /** @type {(inputs: Category_Learningpathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rutas de aprendizaje`)
};

const fr_category_learningpathways1 = /** @type {(inputs: Category_Learningpathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcours d'apprentissage`)
};

const ar_category_learningpathways1 = /** @type {(inputs: Category_Learningpathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسارات التعلّم`)
};

/**
* | output |
* | --- |
* | "Learning Pathways" |
*
* @param {Category_Learningpathways1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_learningpathways1 = /** @type {((inputs?: Category_Learningpathways1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Learningpathways1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_learningpathways1(inputs)
	if (locale === "es") return es_category_learningpathways1(inputs)
	if (locale === "fr") return fr_category_learningpathways1(inputs)
	return ar_category_learningpathways1(inputs)
});
export { category_learningpathways1 as "category.learningPathways" }