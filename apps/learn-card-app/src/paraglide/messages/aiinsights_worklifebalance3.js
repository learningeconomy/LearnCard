/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Worklifebalance3Inputs */

const en_aiinsights_worklifebalance3 = /** @type {(inputs: Aiinsights_Worklifebalance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Life Balance`)
};

const es_aiinsights_worklifebalance3 = /** @type {(inputs: Aiinsights_Worklifebalance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Equilibrio trabajo-vida`)
};

const fr_aiinsights_worklifebalance3 = /** @type {(inputs: Aiinsights_Worklifebalance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Équilibre vie pro-vie perso`)
};

const ar_aiinsights_worklifebalance3 = /** @type {(inputs: Aiinsights_Worklifebalance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوازن بين العمل والحياة`)
};

/**
* | output |
* | --- |
* | "Work Life Balance" |
*
* @param {Aiinsights_Worklifebalance3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_worklifebalance3 = /** @type {((inputs?: Aiinsights_Worklifebalance3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Worklifebalance3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_worklifebalance3(inputs)
	if (locale === "es") return es_aiinsights_worklifebalance3(inputs)
	if (locale === "fr") return fr_aiinsights_worklifebalance3(inputs)
	return ar_aiinsights_worklifebalance3(inputs)
});
export { aiinsights_worklifebalance3 as "aiInsights.workLifeBalance" }