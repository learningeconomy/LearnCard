/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Saveasfile2Inputs */

const en_scanner_saveasfile2 = /** @type {(inputs: Scanner_Saveasfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save as File`)
};

const es_scanner_saveasfile2 = /** @type {(inputs: Scanner_Saveasfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar como archivo`)
};

const fr_scanner_saveasfile2 = /** @type {(inputs: Scanner_Saveasfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer comme fichier`)
};

const ar_scanner_saveasfile2 = /** @type {(inputs: Scanner_Saveasfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ كملف`)
};

/**
* | output |
* | --- |
* | "Save as File" |
*
* @param {Scanner_Saveasfile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_saveasfile2 = /** @type {((inputs?: Scanner_Saveasfile2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Saveasfile2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_saveasfile2(inputs)
	if (locale === "es") return es_scanner_saveasfile2(inputs)
	if (locale === "fr") return fr_scanner_saveasfile2(inputs)
	return ar_scanner_saveasfile2(inputs)
});
export { scanner_saveasfile2 as "scanner.saveAsFile" }