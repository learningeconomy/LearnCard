/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_DoneInputs */

const en_scanner_done = /** @type {(inputs: Scanner_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Done`)
};

const es_scanner_done = /** @type {(inputs: Scanner_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listo`)
};

const de_scanner_done = /** @type {(inputs: Scanner_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fertig`)
};

const ar_scanner_done = /** @type {(inputs: Scanner_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم`)
};

const fr_scanner_done = /** @type {(inputs: Scanner_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminé`)
};

const ko_scanner_done = /** @type {(inputs: Scanner_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`완료`)
};

/**
* | output |
* | --- |
* | "Done" |
*
* @param {Scanner_DoneInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_done = /** @type {((inputs?: Scanner_DoneInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_DoneInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_done(inputs)
	if (locale === "es") return es_scanner_done(inputs)
	if (locale === "de") return de_scanner_done(inputs)
	if (locale === "ar") return ar_scanner_done(inputs)
	if (locale === "fr") return fr_scanner_done(inputs)
	return ko_scanner_done(inputs)
});
export { scanner_done as "scanner.done" }