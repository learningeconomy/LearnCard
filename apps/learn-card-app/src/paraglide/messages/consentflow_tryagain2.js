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

const de_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erneut versuchen`)
};

const ar_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حاول مرة أخرى`)
};

const fr_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réessayer`)
};

const ko_consentflow_tryagain2 = /** @type {(inputs: Consentflow_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다시 시도`)
};

/**
* | output |
* | --- |
* | "Try Again" |
*
* @param {Consentflow_Tryagain2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_tryagain2 = /** @type {((inputs?: Consentflow_Tryagain2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Tryagain2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_tryagain2(inputs)
	if (locale === "es") return es_consentflow_tryagain2(inputs)
	if (locale === "de") return de_consentflow_tryagain2(inputs)
	if (locale === "ar") return ar_consentflow_tryagain2(inputs)
	if (locale === "fr") return fr_consentflow_tryagain2(inputs)
	return ko_consentflow_tryagain2(inputs)
});
export { consentflow_tryagain2 as "consentFlow.tryAgain" }