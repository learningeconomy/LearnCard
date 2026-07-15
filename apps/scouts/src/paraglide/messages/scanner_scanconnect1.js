/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Scanconnect1Inputs */

const en_scanner_scanconnect1 = /** @type {(inputs: Scanner_Scanconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan to connect`)
};

const es_scanner_scanconnect1 = /** @type {(inputs: Scanner_Scanconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanea para conectar`)
};

const fr_scanner_scanconnect1 = /** @type {(inputs: Scanner_Scanconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scannez pour vous connecter`)
};

const ar_scanner_scanconnect1 = /** @type {(inputs: Scanner_Scanconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`امسح للتواصل`)
};

/**
* | output |
* | --- |
* | "Scan to connect" |
*
* @param {Scanner_Scanconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_scanconnect1 = /** @type {((inputs?: Scanner_Scanconnect1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Scanconnect1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_scanconnect1(inputs)
	if (locale === "es") return es_scanner_scanconnect1(inputs)
	if (locale === "fr") return fr_scanner_scanconnect1(inputs)
	return ar_scanner_scanconnect1(inputs)
});
export { scanner_scanconnect1 as "scanner.scanConnect" }