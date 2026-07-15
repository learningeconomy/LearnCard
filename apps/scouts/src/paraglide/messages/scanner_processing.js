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

const fr_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traitement...`)
};

const ar_scanner_processing = /** @type {(inputs: Scanner_ProcessingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري المعالجة...`)
};

/**
* | output |
* | --- |
* | "Processing..." |
*
* @param {Scanner_ProcessingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_processing = /** @type {((inputs?: Scanner_ProcessingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_ProcessingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_processing(inputs)
	if (locale === "es") return es_scanner_processing(inputs)
	if (locale === "fr") return fr_scanner_processing(inputs)
	return ar_scanner_processing(inputs)
});
export { scanner_processing as "scanner.processing" }