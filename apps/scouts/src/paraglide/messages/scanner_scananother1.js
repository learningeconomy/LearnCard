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

const fr_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner un autre`)
};

const ar_scanner_scananother1 = /** @type {(inputs: Scanner_Scananother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح آخر`)
};

/**
* | output |
* | --- |
* | "Scan Another" |
*
* @param {Scanner_Scananother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_scananother1 = /** @type {((inputs?: Scanner_Scananother1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Scananother1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_scananother1(inputs)
	if (locale === "es") return es_scanner_scananother1(inputs)
	if (locale === "fr") return fr_scanner_scananother1(inputs)
	return ar_scanner_scananother1(inputs)
});
export { scanner_scananother1 as "scanner.scanAnother" }