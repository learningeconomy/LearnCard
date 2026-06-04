/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Sharecredential2Inputs */

const en_consentflow_sharecredential2 = /** @type {(inputs: Consentflow_Sharecredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share`)
};

const es_consentflow_sharecredential2 = /** @type {(inputs: Consentflow_Sharecredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir`)
};

const de_consentflow_sharecredential2 = /** @type {(inputs: Consentflow_Sharecredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teilen`)
};

const ar_consentflow_sharecredential2 = /** @type {(inputs: Consentflow_Sharecredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة`)
};

const fr_consentflow_sharecredential2 = /** @type {(inputs: Consentflow_Sharecredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager`)
};

const ko_consentflow_sharecredential2 = /** @type {(inputs: Consentflow_Sharecredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공유`)
};

/**
* | output |
* | --- |
* | "Share" |
*
* @param {Consentflow_Sharecredential2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_sharecredential2 = /** @type {((inputs?: Consentflow_Sharecredential2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Sharecredential2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_sharecredential2(inputs)
	if (locale === "es") return es_consentflow_sharecredential2(inputs)
	if (locale === "de") return de_consentflow_sharecredential2(inputs)
	if (locale === "ar") return ar_consentflow_sharecredential2(inputs)
	if (locale === "fr") return fr_consentflow_sharecredential2(inputs)
	return ko_consentflow_sharecredential2(inputs)
});
export { consentflow_sharecredential2 as "consentFlow.shareCredential" }