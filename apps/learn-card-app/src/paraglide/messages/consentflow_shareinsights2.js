/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Shareinsights2Inputs */

const en_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Insights`)
};

const es_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir información`)
};

const fr_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager les informations`)
};

const ar_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الرؤى`)
};

/**
* | output |
* | --- |
* | "Share Insights" |
*
* @param {Consentflow_Shareinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_shareinsights2 = /** @type {((inputs?: Consentflow_Shareinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Shareinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_shareinsights2(inputs)
	if (locale === "es") return es_consentflow_shareinsights2(inputs)
	if (locale === "fr") return fr_consentflow_shareinsights2(inputs)
	return ar_consentflow_shareinsights2(inputs)
});
export { consentflow_shareinsights2 as "consentFlow.shareInsights" }