/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Consentlayer1Inputs */

const en_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Layer`)
};

const es_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capa de consentimiento`)
};

const de_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zustimmungsebene`)
};

const ar_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طبقة الموافقة`)
};

const fr_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couche de consentement`)
};

const ko_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`동의 레이어`)
};

/**
* | output |
* | --- |
* | "Consent Layer" |
*
* @param {Legal_Consentlayer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const legal_consentlayer1 = /** @type {((inputs?: Legal_Consentlayer1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Consentlayer1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_consentlayer1(inputs)
	if (locale === "es") return es_legal_consentlayer1(inputs)
	if (locale === "de") return de_legal_consentlayer1(inputs)
	if (locale === "ar") return ar_legal_consentlayer1(inputs)
	if (locale === "fr") return fr_legal_consentlayer1(inputs)
	return ko_legal_consentlayer1(inputs)
});
export { legal_consentlayer1 as "legal.consentLayer" }