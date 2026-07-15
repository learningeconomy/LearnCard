/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_EekInputs */

const en_scanner_eek = /** @type {(inputs: Scanner_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eeek!`)
};

const es_scanner_eek = /** @type {(inputs: Scanner_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Eeek!`)
};

const fr_scanner_eek = /** @type {(inputs: Scanner_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups !`)
};

const ar_scanner_eek = /** @type {(inputs: Scanner_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أوه!`)
};

/**
* | output |
* | --- |
* | "Eeek!" |
*
* @param {Scanner_EekInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_eek = /** @type {((inputs?: Scanner_EekInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_EekInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_eek(inputs)
	if (locale === "es") return es_scanner_eek(inputs)
	if (locale === "fr") return fr_scanner_eek(inputs)
	return ar_scanner_eek(inputs)
});
export { scanner_eek as "scanner.eek" }