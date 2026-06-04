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

const de_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link hier einfügen...`)
};

const ar_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق الرابط هنا...`)
};

const fr_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez le lien ici...`)
};

const ko_scanner_pastelink1 = /** @type {(inputs: Scanner_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`여기에 링크 붙여넣기...`)
};

/**
* | output |
* | --- |
* | "Paste link here..." |
*
* @param {Scanner_Pastelink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_pastelink1 = /** @type {((inputs?: Scanner_Pastelink1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Pastelink1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_pastelink1(inputs)
	if (locale === "es") return es_scanner_pastelink1(inputs)
	if (locale === "de") return de_scanner_pastelink1(inputs)
	if (locale === "ar") return ar_scanner_pastelink1(inputs)
	if (locale === "fr") return fr_scanner_pastelink1(inputs)
	return ko_scanner_pastelink1(inputs)
});
export { scanner_pastelink1 as "scanner.pasteLink" }