/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Importfromlink2Inputs */

const en_scanner_importfromlink2 = /** @type {(inputs: Scanner_Importfromlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import from Link`)
};

const es_scanner_importfromlink2 = /** @type {(inputs: Scanner_Importfromlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar desde enlace`)
};

const fr_scanner_importfromlink2 = /** @type {(inputs: Scanner_Importfromlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer depuis un lien`)
};

const ar_scanner_importfromlink2 = /** @type {(inputs: Scanner_Importfromlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد من رابط`)
};

/**
* | output |
* | --- |
* | "Import from Link" |
*
* @param {Scanner_Importfromlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_importfromlink2 = /** @type {((inputs?: Scanner_Importfromlink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Importfromlink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_importfromlink2(inputs)
	if (locale === "es") return es_scanner_importfromlink2(inputs)
	if (locale === "fr") return fr_scanner_importfromlink2(inputs)
	return ar_scanner_importfromlink2(inputs)
});
export { scanner_importfromlink2 as "scanner.importFromLink" }