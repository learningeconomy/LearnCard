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

const fr_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code QR invalide`)
};

const ar_scanner_invalidcode1 = /** @type {(inputs: Scanner_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز QR غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid QR code" |
*
* @param {Scanner_Invalidcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_invalidcode1 = /** @type {((inputs?: Scanner_Invalidcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Invalidcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_invalidcode1(inputs)
	if (locale === "es") return es_scanner_invalidcode1(inputs)
	if (locale === "fr") return fr_scanner_invalidcode1(inputs)
	return ar_scanner_invalidcode1(inputs)
});
export { scanner_invalidcode1 as "scanner.invalidCode" }