/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Invalidcode1Inputs */

const en_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid QR code`)
};

const es_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código QR inválido`)
};

const de_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ungültiger QR-Code`)
};

const ar_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز QR غير صالح`)
};

const fr_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code QR invalide`)
};

const ko_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유효하지 않은 QR 코드`)
};

/**
* | output |
* | --- |
* | "Invalid QR code" |
*
* @param {Scanner_Invalidcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_invalidcode1 = /** @type {((inputs?: Scanner_Invalidcode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Invalidcode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_invalidcode1(inputs)
	if (locale === "es") return es_scanner_invalidcode1(inputs)
	if (locale === "de") return de_scanner_invalidcode1(inputs)
	if (locale === "ar") return ar_scanner_invalidcode1(inputs)
	if (locale === "fr") return fr_scanner_invalidcode1(inputs)
	return ko_scanner_invalidcode1(inputs)
});
export { scanner_invalidcode1 as "scanner.invalidCode" }