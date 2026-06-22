/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Tryagain2Inputs */

const en_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Try Again`)
};

const es_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intentar de nuevo`)
};

const fr_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réessayer`)
};

const ar_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حاول مرة أخرى`)
};

/**
* | output |
* | --- |
* | "Try Again" |
*
* @param {Consentflow_Tryagain2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_tryagain2 = /** @type {((inputs?: Consentflow_Tryagain2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Tryagain2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_tryagain2(inputs)
	if (locale === "es") return es_consentflow_tryagain2(inputs)
	if (locale === "fr") return fr_consentflow_tryagain2(inputs)
	return ar_consentflow_tryagain2(inputs)
});
export { consentflow_tryagain2 as "consentFlow.tryAgain" }