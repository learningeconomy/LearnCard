/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Pastelink1Inputs */

const en_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste link here...`)
};

const es_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega el enlace aquí...`)
};

const fr_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez le lien ici...`)
};

const ar_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق الرابط هنا...`)
};

/**
* | output |
* | --- |
* | "Paste link here..." |
*
* @param {Scanner_Pastelink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_pastelink1 = /** @type {((inputs?: Scanner_Pastelink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Pastelink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_pastelink1(inputs)
	if (locale === "es") return es_scanner_pastelink1(inputs)
	if (locale === "fr") return fr_scanner_pastelink1(inputs)
	return ar_scanner_pastelink1(inputs)
});
export { scanner_pastelink1 as "scanner.pasteLink" }