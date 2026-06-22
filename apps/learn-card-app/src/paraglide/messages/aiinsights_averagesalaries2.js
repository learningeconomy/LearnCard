/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Averagesalaries2Inputs */

const en_aiinsights_averagesalaries2 = /** @type {(inputs: Aiinsights_Averagesalaries2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Average Salaries`)
};

const es_aiinsights_averagesalaries2 = /** @type {(inputs: Aiinsights_Averagesalaries2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salarios promedio`)
};

const fr_aiinsights_averagesalaries2 = /** @type {(inputs: Aiinsights_Averagesalaries2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salaires moyens`)
};

const ar_aiinsights_averagesalaries2 = /** @type {(inputs: Aiinsights_Averagesalaries2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متوسط الرواتب`)
};

/**
* | output |
* | --- |
* | "Average Salaries" |
*
* @param {Aiinsights_Averagesalaries2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_averagesalaries2 = /** @type {((inputs?: Aiinsights_Averagesalaries2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Averagesalaries2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_averagesalaries2(inputs)
	if (locale === "es") return es_aiinsights_averagesalaries2(inputs)
	if (locale === "fr") return fr_aiinsights_averagesalaries2(inputs)
	return ar_aiinsights_averagesalaries2(inputs)
});
export { aiinsights_averagesalaries2 as "aiInsights.averageSalaries" }