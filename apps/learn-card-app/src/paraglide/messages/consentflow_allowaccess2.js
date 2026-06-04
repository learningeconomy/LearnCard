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

const de_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zugang gewähren`)
};

const ar_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السماح بالوصول`)
};

const fr_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoriser l'accès`)
};

const ko_consentflow_allowaccess2 = /** @type {(inputs: Consentflow_Allowaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`액세스 허용`)
};

/**
* | output |
* | --- |
* | "Allow Access" |
*
* @param {Consentflow_Allowaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_allowaccess2 = /** @type {((inputs?: Consentflow_Allowaccess2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allowaccess2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allowaccess2(inputs)
	if (locale === "es") return es_consentflow_allowaccess2(inputs)
	if (locale === "de") return de_consentflow_allowaccess2(inputs)
	if (locale === "ar") return ar_consentflow_allowaccess2(inputs)
	if (locale === "fr") return fr_consentflow_allowaccess2(inputs)
	return ko_consentflow_allowaccess2(inputs)
});
export { consentflow_allowaccess2 as "consentFlow.allowAccess" }