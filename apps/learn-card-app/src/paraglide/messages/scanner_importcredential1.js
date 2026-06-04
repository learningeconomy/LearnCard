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

const de_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigung importieren`)
};

const ar_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد شهادة`)
};

const fr_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer le titre`)
};

const ko_scanner_importcredential1 = /** @type {(inputs: Scanner_Importcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격증명 가져오기`)
};

/**
* | output |
* | --- |
* | "Import Credential" |
*
* @param {Scanner_Importcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_importcredential1 = /** @type {((inputs?: Scanner_Importcredential1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Importcredential1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_importcredential1(inputs)
	if (locale === "es") return es_scanner_importcredential1(inputs)
	if (locale === "de") return de_scanner_importcredential1(inputs)
	if (locale === "ar") return ar_scanner_importcredential1(inputs)
	if (locale === "fr") return fr_scanner_importcredential1(inputs)
	return ko_scanner_importcredential1(inputs)
});
export { scanner_importcredential1 as "scanner.importCredential" }