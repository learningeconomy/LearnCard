/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Scananother1Inputs */

const en_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan Another`)
};

const es_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear otro`)
};

const de_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nochmal scannen`)
};

const ar_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح آخر`)
};

const fr_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner un autre`)
};

const ko_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다시 스캔`)
};

/**
* | output |
* | --- |
* | "Scan Another" |
*
* @param {Scanner_Scananother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_scananother1 = /** @type {((inputs?: Scanner_Scananother1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Scananother1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_scananother1(inputs)
	if (locale === "es") return es_scanner_scananother1(inputs)
	if (locale === "de") return de_scanner_scananother1(inputs)
	if (locale === "ar") return ar_scanner_scananother1(inputs)
	if (locale === "fr") return fr_scanner_scananother1(inputs)
	return ko_scanner_scananother1(inputs)
});
export { scanner_scananother1 as "scanner.scanAnother" }