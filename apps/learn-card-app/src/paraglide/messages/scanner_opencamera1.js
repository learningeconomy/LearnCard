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

const de_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kamera öffnen`)
};

const ar_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح الكاميرا`)
};

const fr_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir la caméra`)
};

const ko_scanner_opencamera1 = /** @type {(inputs: Scanner_Opencamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`카메라 열기`)
};

/**
* | output |
* | --- |
* | "Open Camera" |
*
* @param {Scanner_Opencamera1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_opencamera1 = /** @type {((inputs?: Scanner_Opencamera1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Opencamera1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_opencamera1(inputs)
	if (locale === "es") return es_scanner_opencamera1(inputs)
	if (locale === "de") return de_scanner_opencamera1(inputs)
	if (locale === "ar") return ar_scanner_opencamera1(inputs)
	if (locale === "fr") return fr_scanner_opencamera1(inputs)
	return ko_scanner_opencamera1(inputs)
});
export { scanner_opencamera1 as "scanner.openCamera" }