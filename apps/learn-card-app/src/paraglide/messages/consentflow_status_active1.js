/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Status_Active1Inputs */

const en_consentflow_status_active1 = /** @type {(inputs: Consentflow_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Active`)
};

const es_consentflow_status_active1 = /** @type {(inputs: Consentflow_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activo`)
};

const de_consentflow_status_active1 = /** @type {(inputs: Consentflow_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktiv`)
};

const ar_consentflow_status_active1 = /** @type {(inputs: Consentflow_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشط`)
};

const fr_consentflow_status_active1 = /** @type {(inputs: Consentflow_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actif`)
};

const ko_consentflow_status_active1 = /** @type {(inputs: Consentflow_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`활성`)
};

/**
* | output |
* | --- |
* | "Active" |
*
* @param {Consentflow_Status_Active1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_status_active1 = /** @type {((inputs?: Consentflow_Status_Active1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Status_Active1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_status_active1(inputs)
	if (locale === "es") return es_consentflow_status_active1(inputs)
	if (locale === "de") return de_consentflow_status_active1(inputs)
	if (locale === "ar") return ar_consentflow_status_active1(inputs)
	if (locale === "fr") return fr_consentflow_status_active1(inputs)
	return ko_consentflow_status_active1(inputs)
});
export { consentflow_status_active1 as "consentFlow.status.active" }