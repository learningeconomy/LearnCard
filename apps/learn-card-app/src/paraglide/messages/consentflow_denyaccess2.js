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

const fr_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refuser l'accès`)
};

const ar_consentflow_denyaccess2 = /** @type {(inputs: Consentflow_Denyaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض الوصول`)
};

/**
* | output |
* | --- |
* | "Deny Access" |
*
* @param {Consentflow_Denyaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_denyaccess2 = /** @type {((inputs?: Consentflow_Denyaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Denyaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_denyaccess2(inputs)
	if (locale === "es") return es_consentflow_denyaccess2(inputs)
	if (locale === "fr") return fr_consentflow_denyaccess2(inputs)
	return ar_consentflow_denyaccess2(inputs)
});
export { consentflow_denyaccess2 as "consentFlow.denyAccess" }