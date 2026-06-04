/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Unknown1Inputs */

const en_consentflow_unknown1 = /** @type {(inputs: Consentflow_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown`)
};

const es_consentflow_unknown1 = /** @type {(inputs: Consentflow_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconocido`)
};

const de_consentflow_unknown1 = /** @type {(inputs: Consentflow_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unbekannt`)
};

const ar_consentflow_unknown1 = /** @type {(inputs: Consentflow_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير معروف`)
};

const fr_consentflow_unknown1 = /** @type {(inputs: Consentflow_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inconnu`)
};

const ko_consentflow_unknown1 = /** @type {(inputs: Consentflow_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`알 수 없음`)
};

/**
* | output |
* | --- |
* | "Unknown" |
*
* @param {Consentflow_Unknown1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_unknown1 = /** @type {((inputs?: Consentflow_Unknown1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Unknown1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_unknown1(inputs)
	if (locale === "es") return es_consentflow_unknown1(inputs)
	if (locale === "de") return de_consentflow_unknown1(inputs)
	if (locale === "ar") return ar_consentflow_unknown1(inputs)
	if (locale === "fr") return fr_consentflow_unknown1(inputs)
	return ko_consentflow_unknown1(inputs)
});
export { consentflow_unknown1 as "consentFlow.unknown" }