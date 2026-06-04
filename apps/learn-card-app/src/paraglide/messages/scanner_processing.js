/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_ProcessingInputs */

const en_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Processing...`)
};

const es_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procesando...`)
};

const de_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verarbeitung...`)
};

const ar_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري المعالجة...`)
};

const fr_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traitement...`)
};

const ko_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`처리 중...`)
};

/**
* | output |
* | --- |
* | "Processing..." |
*
* @param {Scanner_ProcessingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_processing = /** @type {((inputs?: Scanner_ProcessingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_ProcessingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_processing(inputs)
	if (locale === "es") return es_scanner_processing(inputs)
	if (locale === "de") return de_scanner_processing(inputs)
	if (locale === "ar") return ar_scanner_processing(inputs)
	if (locale === "fr") return fr_scanner_processing(inputs)
	return ko_scanner_processing(inputs)
});
export { scanner_processing as "scanner.processing" }