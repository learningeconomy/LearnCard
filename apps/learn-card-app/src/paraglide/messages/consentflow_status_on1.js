/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Status_On1Inputs */

const en_consentflow_status_on1 = /** @type {(inputs: Consentflow_Status_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On`)
};

const es_consentflow_status_on1 = /** @type {(inputs: Consentflow_Status_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activado`)
};

const fr_consentflow_status_on1 = /** @type {(inputs: Consentflow_Status_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activé`)
};

const ar_consentflow_status_on1 = /** @type {(inputs: Consentflow_Status_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشغيل`)
};

/**
* | output |
* | --- |
* | "On" |
*
* @param {Consentflow_Status_On1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_status_on1 = /** @type {((inputs?: Consentflow_Status_On1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Status_On1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_status_on1(inputs)
	if (locale === "es") return es_consentflow_status_on1(inputs)
	if (locale === "fr") return fr_consentflow_status_on1(inputs)
	return ar_consentflow_status_on1(inputs)
});
export { consentflow_status_on1 as "consentFlow.status.on" }