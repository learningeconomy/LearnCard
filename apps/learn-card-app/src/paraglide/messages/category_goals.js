/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_GoalsInputs */

const en_category_goals = /** @type {(inputs: Category_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Goals`)
};

const es_category_goals = /** @type {(inputs: Category_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objetivos`)
};

const fr_category_goals = /** @type {(inputs: Category_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objectifs`)
};

const ar_category_goals = /** @type {(inputs: Category_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأهداف`)
};

/**
* | output |
* | --- |
* | "Goals" |
*
* @param {Category_GoalsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_goals = /** @type {((inputs?: Category_GoalsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_GoalsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_goals(inputs)
	if (locale === "es") return es_category_goals(inputs)
	if (locale === "fr") return fr_category_goals(inputs)
	return ar_category_goals(inputs)
});
export { category_goals as "category.goals" }