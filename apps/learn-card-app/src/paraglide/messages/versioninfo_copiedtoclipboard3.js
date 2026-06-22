/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Copiedtoclipboard3Inputs */

const en_versioninfo_copiedtoclipboard3 = /** @type {(inputs: Versioninfo_Copiedtoclipboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copied to clipboard`)
};

const es_versioninfo_copiedtoclipboard3 = /** @type {(inputs: Versioninfo_Copiedtoclipboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiado al portapapeles`)
};

const fr_versioninfo_copiedtoclipboard3 = /** @type {(inputs: Versioninfo_Copiedtoclipboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copié dans le presse-papiers`)
};

const ar_versioninfo_copiedtoclipboard3 = /** @type {(inputs: Versioninfo_Copiedtoclipboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم النسخ إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Copied to clipboard" |
*
* @param {Versioninfo_Copiedtoclipboard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_copiedtoclipboard3 = /** @type {((inputs?: Versioninfo_Copiedtoclipboard3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Copiedtoclipboard3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_copiedtoclipboard3(inputs)
	if (locale === "es") return es_versioninfo_copiedtoclipboard3(inputs)
	if (locale === "fr") return fr_versioninfo_copiedtoclipboard3(inputs)
	return ar_versioninfo_copiedtoclipboard3(inputs)
});
export { versioninfo_copiedtoclipboard3 as "versionInfo.copiedToClipboard" }