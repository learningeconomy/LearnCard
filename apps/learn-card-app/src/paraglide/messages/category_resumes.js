/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_ResumesInputs */

const en_category_resumes = /** @type {(inputs: Category_ResumesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumes`)
};

const es_category_resumes = /** @type {(inputs: Category_ResumesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Currículums`)
};

const fr_category_resumes = /** @type {(inputs: Category_ResumesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CV`)
};

const ar_category_resumes = /** @type {(inputs: Category_ResumesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السير الذاتية`)
};

/**
* | output |
* | --- |
* | "Resumes" |
*
* @param {Category_ResumesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_resumes = /** @type {((inputs?: Category_ResumesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_ResumesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_resumes(inputs)
	if (locale === "es") return es_category_resumes(inputs)
	if (locale === "fr") return fr_category_resumes(inputs)
	return ar_category_resumes(inputs)
});
export { category_resumes as "category.resumes" }