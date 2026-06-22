/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_ScanningInputs */

const en_scanner_scanning = /** @type {(inputs: Scanner_ScanningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanning...`)
};

const es_scanner_scanning = /** @type {(inputs: Scanner_ScanningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escaneando...`)
};

const fr_scanner_scanning = /** @type {(inputs: Scanner_ScanningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan en cours...`)
};

const ar_scanner_scanning = /** @type {(inputs: Scanner_ScanningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري المسح...`)
};

/**
* | output |
* | --- |
* | "Scanning..." |
*
* @param {Scanner_ScanningInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_scanning = /** @type {((inputs?: Scanner_ScanningInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_ScanningInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_scanning(inputs)
	if (locale === "es") return es_scanner_scanning(inputs)
	if (locale === "fr") return fr_scanner_scanning(inputs)
	return ar_scanner_scanning(inputs)
});
export { scanner_scanning as "scanner.scanning" }