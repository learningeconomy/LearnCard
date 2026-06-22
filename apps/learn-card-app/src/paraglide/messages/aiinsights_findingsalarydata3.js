/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Findingsalarydata3Inputs */

const en_aiinsights_findingsalarydata3 = /** @type {(inputs: Aiinsights_Findingsalarydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finding salary data...`)
};

const es_aiinsights_findingsalarydata3 = /** @type {(inputs: Aiinsights_Findingsalarydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscando datos salariales...`)
};

const fr_aiinsights_findingsalarydata3 = /** @type {(inputs: Aiinsights_Findingsalarydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherche de données salariales...`)
};

const ar_aiinsights_findingsalarydata3 = /** @type {(inputs: Aiinsights_Findingsalarydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري البحث عن بيانات الرواتب`)
};

/**
* | output |
* | --- |
* | "Finding salary data..." |
*
* @param {Aiinsights_Findingsalarydata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_findingsalarydata3 = /** @type {((inputs?: Aiinsights_Findingsalarydata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Findingsalarydata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_findingsalarydata3(inputs)
	if (locale === "es") return es_aiinsights_findingsalarydata3(inputs)
	if (locale === "fr") return fr_aiinsights_findingsalarydata3(inputs)
	return ar_aiinsights_findingsalarydata3(inputs)
});
export { aiinsights_findingsalarydata3 as "aiInsights.findingSalaryData" }