/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Salarynotavailable3Inputs */

const en_aiinsights_salarynotavailable3 = /** @type {(inputs: Aiinsights_Salarynotavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salary not available`)
};

const es_aiinsights_salarynotavailable3 = /** @type {(inputs: Aiinsights_Salarynotavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salario no disponible`)
};

const fr_aiinsights_salarynotavailable3 = /** @type {(inputs: Aiinsights_Salarynotavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salaire non disponible`)
};

const ar_aiinsights_salarynotavailable3 = /** @type {(inputs: Aiinsights_Salarynotavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الراتب غير متاح`)
};

/**
* | output |
* | --- |
* | "Salary not available" |
*
* @param {Aiinsights_Salarynotavailable3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_salarynotavailable3 = /** @type {((inputs?: Aiinsights_Salarynotavailable3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Salarynotavailable3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_salarynotavailable3(inputs)
	if (locale === "es") return es_aiinsights_salarynotavailable3(inputs)
	if (locale === "fr") return fr_aiinsights_salarynotavailable3(inputs)
	return ar_aiinsights_salarynotavailable3(inputs)
});
export { aiinsights_salarynotavailable3 as "aiInsights.salaryNotAvailable" }