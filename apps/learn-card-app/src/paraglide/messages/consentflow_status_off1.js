/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Status_Off1Inputs */

const en_consentflow_status_off1 = /** @type {(inputs: Consentflow_Status_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Off`)
};

const es_consentflow_status_off1 = /** @type {(inputs: Consentflow_Status_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desactivado`)
};

const de_consentflow_status_off1 = /** @type {(inputs: Consentflow_Status_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aus`)
};

const ar_consentflow_status_off1 = /** @type {(inputs: Consentflow_Status_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إيقاف`)
};

const fr_consentflow_status_off1 = /** @type {(inputs: Consentflow_Status_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désactivé`)
};

const ko_consentflow_status_off1 = /** @type {(inputs: Consentflow_Status_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`꺼짐`)
};

/**
* | output |
* | --- |
* | "Off" |
*
* @param {Consentflow_Status_Off1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_status_off1 = /** @type {((inputs?: Consentflow_Status_Off1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Status_Off1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_status_off1(inputs)
	if (locale === "es") return es_consentflow_status_off1(inputs)
	if (locale === "de") return de_consentflow_status_off1(inputs)
	if (locale === "ar") return ar_consentflow_status_off1(inputs)
	if (locale === "fr") return fr_consentflow_status_off1(inputs)
	return ko_consentflow_status_off1(inputs)
});
export { consentflow_status_off1 as "consentFlow.status.off" }