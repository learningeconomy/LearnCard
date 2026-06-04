/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Denyaccess2Inputs */

const en_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deny Access`)
};

const es_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Denegar acceso`)
};

const de_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zugang verweigern`)
};

const ar_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض الوصول`)
};

const fr_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refuser l'accès`)
};

const ko_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`액세스 거부`)
};

/**
* | output |
* | --- |
* | "Deny Access" |
*
* @param {Consentflow_Denyaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_denyaccess2 = /** @type {((inputs?: Consentflow_Denyaccess2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Denyaccess2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_denyaccess2(inputs)
	if (locale === "es") return es_consentflow_denyaccess2(inputs)
	if (locale === "de") return de_consentflow_denyaccess2(inputs)
	if (locale === "ar") return ar_consentflow_denyaccess2(inputs)
	if (locale === "fr") return fr_consentflow_denyaccess2(inputs)
	return ko_consentflow_denyaccess2(inputs)
});
export { consentflow_denyaccess2 as "consentFlow.denyAccess" }