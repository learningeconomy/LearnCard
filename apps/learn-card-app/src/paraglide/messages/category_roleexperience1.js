/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Roleexperience1Inputs */

const en_category_roleexperience1 = /** @type {(inputs: Category_Roleexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Role Experience`)
};

const es_category_roleexperience1 = /** @type {(inputs: Category_Roleexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia en el puesto`)
};

const fr_category_roleexperience1 = /** @type {(inputs: Category_Roleexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience de poste`)
};

const ar_category_roleexperience1 = /** @type {(inputs: Category_Roleexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرة الدور`)
};

/**
* | output |
* | --- |
* | "Role Experience" |
*
* @param {Category_Roleexperience1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_roleexperience1 = /** @type {((inputs?: Category_Roleexperience1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Roleexperience1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_roleexperience1(inputs)
	if (locale === "es") return es_category_roleexperience1(inputs)
	if (locale === "fr") return fr_category_roleexperience1(inputs)
	return ar_category_roleexperience1(inputs)
});
export { category_roleexperience1 as "category.roleExperience" }