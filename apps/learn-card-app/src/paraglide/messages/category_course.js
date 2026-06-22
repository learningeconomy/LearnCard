/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_CourseInputs */

const en_category_course = /** @type {(inputs: Category_CourseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Course`)
};

const es_category_course = /** @type {(inputs: Category_CourseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Curso`)
};

const fr_category_course = /** @type {(inputs: Category_CourseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cours`)
};

const ar_category_course = /** @type {(inputs: Category_CourseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دورة`)
};

/**
* | output |
* | --- |
* | "Course" |
*
* @param {Category_CourseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_course = /** @type {((inputs?: Category_CourseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_CourseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_course(inputs)
	if (locale === "es") return es_category_course(inputs)
	if (locale === "fr") return fr_category_course(inputs)
	return ar_category_course(inputs)
});
export { category_course as "category.course" }