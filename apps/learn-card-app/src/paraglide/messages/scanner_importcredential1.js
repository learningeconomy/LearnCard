/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Importcredential1Inputs */

const en_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Credential`)
};

const es_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar credencial`)
};

const fr_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer le titre`)
};

const ar_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد شهادة`)
};

/**
* | output |
* | --- |
* | "Import Credential" |
*
* @param {Scanner_Importcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_importcredential1 = /** @type {((inputs?: Scanner_Importcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Importcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_importcredential1(inputs)
	if (locale === "es") return es_scanner_importcredential1(inputs)
	if (locale === "fr") return fr_scanner_importcredential1(inputs)
	return ar_scanner_importcredential1(inputs)
});
export { scanner_importcredential1 as "scanner.importCredential" }