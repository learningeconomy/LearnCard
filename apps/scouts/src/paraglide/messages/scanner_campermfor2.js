/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Campermfor2Inputs */

const en_scanner_campermfor2 = /** @type {(inputs: Scanner_Campermfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enable camera permissions for:`)
};

const es_scanner_campermfor2 = /** @type {(inputs: Scanner_Campermfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilitar permisos de cámara para:`)
};

const fr_scanner_campermfor2 = /** @type {(inputs: Scanner_Campermfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activez les autorisations de la caméra pour :`)
};

const ar_scanner_campermfor2 = /** @type {(inputs: Scanner_Campermfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enable camera permissions for:`)
};

/**
* | output |
* | --- |
* | "Enable camera permissions for:" |
*
* @param {Scanner_Campermfor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_campermfor2 = /** @type {((inputs?: Scanner_Campermfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Campermfor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_campermfor2(inputs)
	if (locale === "es") return es_scanner_campermfor2(inputs)
	if (locale === "fr") return fr_scanner_campermfor2(inputs)
	return ar_scanner_campermfor2(inputs)
});
export { scanner_campermfor2 as "scanner.camPermFor" }