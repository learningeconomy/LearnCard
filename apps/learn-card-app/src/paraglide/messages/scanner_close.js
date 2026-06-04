/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_CloseInputs */

const en_scanner_close = /** @type {(inputs: Scanner_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_scanner_close = /** @type {(inputs: Scanner_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const de_scanner_close = /** @type {(inputs: Scanner_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schließen`)
};

const ar_scanner_close = /** @type {(inputs: Scanner_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

const fr_scanner_close = /** @type {(inputs: Scanner_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ko_scanner_close = /** @type {(inputs: Scanner_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`닫기`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Scanner_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_close = /** @type {((inputs?: Scanner_CloseInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_CloseInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_close(inputs)
	if (locale === "es") return es_scanner_close(inputs)
	if (locale === "de") return de_scanner_close(inputs)
	if (locale === "ar") return ar_scanner_close(inputs)
	if (locale === "fr") return fr_scanner_close(inputs)
	return ko_scanner_close(inputs)
});
export { scanner_close as "scanner.close" }