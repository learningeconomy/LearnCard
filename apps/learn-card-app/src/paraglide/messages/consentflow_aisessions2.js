/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Aisessions2Inputs */

const en_consentflow_aisessions2 = /** @type {(inputs: Consentflow_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Sessions`)
};

const es_consentflow_aisessions2 = /** @type {(inputs: Consentflow_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones de IA`)
};

const fr_consentflow_aisessions2 = /** @type {(inputs: Consentflow_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sessions IA`)
};

const ar_consentflow_aisessions2 = /** @type {(inputs: Consentflow_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Sessions" |
*
* @param {Consentflow_Aisessions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_aisessions2 = /** @type {((inputs?: Consentflow_Aisessions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Aisessions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_aisessions2(inputs)
	if (locale === "es") return es_consentflow_aisessions2(inputs)
	if (locale === "fr") return fr_consentflow_aisessions2(inputs)
	return ar_consentflow_aisessions2(inputs)
});
export { consentflow_aisessions2 as "consentFlow.aiSessions" }