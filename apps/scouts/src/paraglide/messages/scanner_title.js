/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_TitleInputs */

const en_scanner_title = /** @type {(inputs: Scanner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan QR Code`)
};

const es_scanner_title = /** @type {(inputs: Scanner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear código QR`)
};

const fr_scanner_title = /** @type {(inputs: Scanner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner le code QR`)
};

const ar_scanner_title = /** @type {(inputs: Scanner_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح رمز QR`)
};

/**
* | output |
* | --- |
* | "Scan QR Code" |
*
* @param {Scanner_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_title = /** @type {((inputs?: Scanner_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_title(inputs)
	if (locale === "es") return es_scanner_title(inputs)
	if (locale === "fr") return fr_scanner_title(inputs)
	return ar_scanner_title(inputs)
});
export { scanner_title as "scanner.title" }