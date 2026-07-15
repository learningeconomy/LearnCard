/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Errocurred1Inputs */

const en_scanner_errocurred1 = /** @type {(inputs: Scanner_Errocurred1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred!`)
};

const es_scanner_errocurred1 = /** @type {(inputs: Scanner_Errocurred1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Ocurrió un error!`)
};

const fr_scanner_errocurred1 = /** @type {(inputs: Scanner_Errocurred1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue !`)
};

const ar_scanner_errocurred1 = /** @type {(inputs: Scanner_Errocurred1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred!`)
};

/**
* | output |
* | --- |
* | "An error occurred!" |
*
* @param {Scanner_Errocurred1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_errocurred1 = /** @type {((inputs?: Scanner_Errocurred1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Errocurred1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_errocurred1(inputs)
	if (locale === "es") return es_scanner_errocurred1(inputs)
	if (locale === "fr") return fr_scanner_errocurred1(inputs)
	return ar_scanner_errocurred1(inputs)
});
export { scanner_errocurred1 as "scanner.errOcurred" }