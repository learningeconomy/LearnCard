/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Scanqr2Inputs */

const en_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan QR Code`)
};

const es_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear código QR`)
};

const fr_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner le code QR`)
};

const ar_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح رمز QR`)
};

/**
* | output |
* | --- |
* | "Scan QR Code" |
*
* @param {Scanner_Scanqr2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_scanqr2 = /** @type {((inputs?: Scanner_Scanqr2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Scanqr2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_scanqr2(inputs)
	if (locale === "es") return es_scanner_scanqr2(inputs)
	if (locale === "fr") return fr_scanner_scanqr2(inputs)
	return ar_scanner_scanqr2(inputs)
});
export { scanner_scanqr2 as "scanner.scanQR" }