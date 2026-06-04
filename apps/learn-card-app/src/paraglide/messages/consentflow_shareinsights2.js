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

const de_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erkenntnisse teilen`)
};

const ar_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الرؤى`)
};

const fr_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager les informations`)
};

const ko_consentflow_shareinsights2 = /** @type {(inputs: Consentflow_Shareinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`인사이트 공유`)
};

/**
* | output |
* | --- |
* | "Share Insights" |
*
* @param {Consentflow_Shareinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_shareinsights2 = /** @type {((inputs?: Consentflow_Shareinsights2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Shareinsights2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_shareinsights2(inputs)
	if (locale === "es") return es_consentflow_shareinsights2(inputs)
	if (locale === "de") return de_consentflow_shareinsights2(inputs)
	if (locale === "ar") return ar_consentflow_shareinsights2(inputs)
	if (locale === "fr") return fr_consentflow_shareinsights2(inputs)
	return ko_consentflow_shareinsights2(inputs)
});
export { consentflow_shareinsights2 as "consentFlow.shareInsights" }