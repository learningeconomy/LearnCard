/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Allowaccess2Inputs */

const en_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allow Access`)
};

const es_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permitir acceso`)
};

const fr_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoriser l'accès`)
};

const ar_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السماح بالوصول`)
};

/**
* | output |
* | --- |
* | "Allow Access" |
*
* @param {Consentflow_Allowaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_allowaccess2 = /** @type {((inputs?: Consentflow_Allowaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allowaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allowaccess2(inputs)
	if (locale === "es") return es_consentflow_allowaccess2(inputs)
	if (locale === "fr") return fr_consentflow_allowaccess2(inputs)
	return ar_consentflow_allowaccess2(inputs)
});
export { consentflow_allowaccess2 as "consentFlow.allowAccess" }