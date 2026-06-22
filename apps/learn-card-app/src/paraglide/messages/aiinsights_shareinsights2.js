/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Shareinsights2Inputs */

const en_aiinsights_shareinsights2 = /** @type {(inputs: Aiinsights_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Insights`)
};

const es_aiinsights_shareinsights2 = /** @type {(inputs: Aiinsights_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir Insights`)
};

const fr_aiinsights_shareinsights2 = /** @type {(inputs: Aiinsights_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager les Insights`)
};

const ar_aiinsights_shareinsights2 = /** @type {(inputs: Aiinsights_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الرؤى`)
};

/**
* | output |
* | --- |
* | "Share Insights" |
*
* @param {Aiinsights_Shareinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_shareinsights2 = /** @type {((inputs?: Aiinsights_Shareinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Shareinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_shareinsights2(inputs)
	if (locale === "es") return es_aiinsights_shareinsights2(inputs)
	if (locale === "fr") return fr_aiinsights_shareinsights2(inputs)
	return ar_aiinsights_shareinsights2(inputs)
});
export { aiinsights_shareinsights2 as "aiInsights.shareInsights" }