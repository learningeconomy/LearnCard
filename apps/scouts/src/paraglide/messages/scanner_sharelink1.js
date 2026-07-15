/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Sharelink1Inputs */

const en_scanner_sharelink1 = /** @type {(inputs: Scanner_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Link`)
};

const es_scanner_sharelink1 = /** @type {(inputs: Scanner_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir Enlace`)
};

const fr_scanner_sharelink1 = /** @type {(inputs: Scanner_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager le lien`)
};

const ar_scanner_sharelink1 = /** @type {(inputs: Scanner_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الرابط`)
};

/**
* | output |
* | --- |
* | "Share Link" |
*
* @param {Scanner_Sharelink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_sharelink1 = /** @type {((inputs?: Scanner_Sharelink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Sharelink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_sharelink1(inputs)
	if (locale === "es") return es_scanner_sharelink1(inputs)
	if (locale === "fr") return fr_scanner_sharelink1(inputs)
	return ar_scanner_sharelink1(inputs)
});
export { scanner_sharelink1 as "scanner.shareLink" }