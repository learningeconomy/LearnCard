/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Workexperience1Inputs */

const en_category_workexperience1 = /** @type {(inputs: Category_Workexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Experience`)
};

const es_category_workexperience1 = /** @type {(inputs: Category_Workexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia laboral`)
};

const fr_category_workexperience1 = /** @type {(inputs: Category_Workexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience professionnelle`)
};

const ar_category_workexperience1 = /** @type {(inputs: Category_Workexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخبرة العملية`)
};

/**
* | output |
* | --- |
* | "Work Experience" |
*
* @param {Category_Workexperience1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_workexperience1 = /** @type {((inputs?: Category_Workexperience1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Workexperience1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_workexperience1(inputs)
	if (locale === "es") return es_category_workexperience1(inputs)
	if (locale === "fr") return fr_category_workexperience1(inputs)
	return ar_category_workexperience1(inputs)
});
export { category_workexperience1 as "category.workExperience" }