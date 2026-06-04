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

const de_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`QR-Code scannen`)
};

const ar_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح رمز QR`)
};

const fr_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner le code QR`)
};

const ko_scanner_scanqr2 = /** @type {(inputs: Scanner_Scanqr2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`QR 코드 스캔`)
};

/**
* | output |
* | --- |
* | "Scan QR Code" |
*
* @param {Scanner_Scanqr2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_scanqr2 = /** @type {((inputs?: Scanner_Scanqr2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Scanqr2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_scanqr2(inputs)
	if (locale === "es") return es_scanner_scanqr2(inputs)
	if (locale === "de") return de_scanner_scanqr2(inputs)
	if (locale === "ar") return ar_scanner_scanqr2(inputs)
	if (locale === "fr") return fr_scanner_scanqr2(inputs)
	return ko_scanner_scanqr2(inputs)
});
export { scanner_scanqr2 as "scanner.scanQR" }