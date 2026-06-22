/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Scanlabel1Inputs */

const en_scanner_scanlabel1 = /** @type {(inputs: Scanner_Scanlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan`)
};

const es_scanner_scanlabel1 = /** @type {(inputs: Scanner_Scanlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear`)
};

const fr_scanner_scanlabel1 = /** @type {(inputs: Scanner_Scanlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner`)
};

const ar_scanner_scanlabel1 = /** @type {(inputs: Scanner_Scanlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح`)
};

/**
* | output |
* | --- |
* | "Scan" |
*
* @param {Scanner_Scanlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_scanlabel1 = /** @type {((inputs?: Scanner_Scanlabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Scanlabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_scanlabel1(inputs)
	if (locale === "es") return es_scanner_scanlabel1(inputs)
	if (locale === "fr") return fr_scanner_scanlabel1(inputs)
	return ar_scanner_scanlabel1(inputs)
});
export { scanner_scanlabel1 as "scanner.scanLabel" }