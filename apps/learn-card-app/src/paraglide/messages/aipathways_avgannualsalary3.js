/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Avgannualsalary3Inputs */

const en_aipathways_avgannualsalary3 = /** @type {(inputs: Aipathways_Avgannualsalary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AVG. ANNUAL SALARY`)
};

const es_aipathways_avgannualsalary3 = /** @type {(inputs: Aipathways_Avgannualsalary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SALARIO ANUAL PROMEDIO`)
};

const fr_aipathways_avgannualsalary3 = /** @type {(inputs: Aipathways_Avgannualsalary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SALAIRE ANNUEL MOYEN`)
};

const ar_aipathways_avgannualsalary3 = /** @type {(inputs: Aipathways_Avgannualsalary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متوسط الراتب السنوي`)
};

/**
* | output |
* | --- |
* | "AVG. ANNUAL SALARY" |
*
* @param {Aipathways_Avgannualsalary3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_avgannualsalary3 = /** @type {((inputs?: Aipathways_Avgannualsalary3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Avgannualsalary3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_avgannualsalary3(inputs)
	if (locale === "es") return es_aipathways_avgannualsalary3(inputs)
	if (locale === "fr") return fr_aipathways_avgannualsalary3(inputs)
	return ar_aipathways_avgannualsalary3(inputs)
});
export { aipathways_avgannualsalary3 as "aiPathways.avgAnnualSalary" }