/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_SalaryInputs */

const en_pathways_salary = /** @type {(inputs: Pathways_SalaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salary`)
};

const es_pathways_salary = /** @type {(inputs: Pathways_SalaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salario`)
};

const fr_pathways_salary = /** @type {(inputs: Pathways_SalaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salaire`)
};

const ar_pathways_salary = /** @type {(inputs: Pathways_SalaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الراتب`)
};

/**
* | output |
* | --- |
* | "Salary" |
*
* @param {Pathways_SalaryInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_salary = /** @type {((inputs?: Pathways_SalaryInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_SalaryInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_salary(inputs)
	if (locale === "es") return es_pathways_salary(inputs)
	if (locale === "fr") return fr_pathways_salary(inputs)
	return ar_pathways_salary(inputs)
});
export { pathways_salary as "pathways.salary" }