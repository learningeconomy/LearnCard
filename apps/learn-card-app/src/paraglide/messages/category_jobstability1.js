/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Jobstability1Inputs */

const en_category_jobstability1 = /** @type {(inputs: Category_Jobstability1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Stability`)
};

const es_category_jobstability1 = /** @type {(inputs: Category_Jobstability1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estabilidad laboral`)
};

const fr_category_jobstability1 = /** @type {(inputs: Category_Jobstability1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stabilité de l'emploi`)
};

const ar_category_jobstability1 = /** @type {(inputs: Category_Jobstability1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاستقرار الوظيفي`)
};

/**
* | output |
* | --- |
* | "Job Stability" |
*
* @param {Category_Jobstability1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_jobstability1 = /** @type {((inputs?: Category_Jobstability1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Jobstability1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_jobstability1(inputs)
	if (locale === "es") return es_category_jobstability1(inputs)
	if (locale === "fr") return fr_category_jobstability1(inputs)
	return ar_category_jobstability1(inputs)
});
export { category_jobstability1 as "category.jobStability" }