/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_JobInputs */

const en_category_job = /** @type {(inputs: Category_JobInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job`)
};

const es_category_job = /** @type {(inputs: Category_JobInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empleo`)
};

const fr_category_job = /** @type {(inputs: Category_JobInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emploi`)
};

const ar_category_job = /** @type {(inputs: Category_JobInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وظيفة`)
};

/**
* | output |
* | --- |
* | "Job" |
*
* @param {Category_JobInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_job = /** @type {((inputs?: Category_JobInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_JobInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_job(inputs)
	if (locale === "es") return es_category_job(inputs)
	if (locale === "fr") return fr_category_job(inputs)
	return ar_category_job(inputs)
});
export { category_job as "category.job" }