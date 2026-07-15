/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Opencamera1Inputs */

const en_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Camera`)
};

const es_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir cámara`)
};

const fr_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir la caméra`)
};

const ar_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح الكاميرا`)
};

/**
* | output |
* | --- |
* | "Open Camera" |
*
* @param {Scanner_Opencamera1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_opencamera1 = /** @type {((inputs?: Scanner_Opencamera1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Opencamera1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_opencamera1(inputs)
	if (locale === "es") return es_scanner_opencamera1(inputs)
	if (locale === "fr") return fr_scanner_opencamera1(inputs)
	return ar_scanner_opencamera1(inputs)
});
export { scanner_opencamera1 as "scanner.openCamera" }