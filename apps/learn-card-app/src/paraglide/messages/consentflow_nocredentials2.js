/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Nocredentials2Inputs */

const en_consentflow_nocredentials2 = /** @type {(inputs: Consentflow_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Credentials`)
};

const es_consentflow_nocredentials2 = /** @type {(inputs: Consentflow_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin credenciales`)
};

const fr_consentflow_nocredentials2 = /** @type {(inputs: Consentflow_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune certification`)
};

const ar_consentflow_nocredentials2 = /** @type {(inputs: Consentflow_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد بيانات اعتماد`)
};

/**
* | output |
* | --- |
* | "No Credentials" |
*
* @param {Consentflow_Nocredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_nocredentials2 = /** @type {((inputs?: Consentflow_Nocredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Nocredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_nocredentials2(inputs)
	if (locale === "es") return es_consentflow_nocredentials2(inputs)
	if (locale === "fr") return fr_consentflow_nocredentials2(inputs)
	return ar_consentflow_nocredentials2(inputs)
});
export { consentflow_nocredentials2 as "consentFlow.noCredentials" }