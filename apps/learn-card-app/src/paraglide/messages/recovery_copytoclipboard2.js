/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Copytoclipboard2Inputs */

const en_recovery_copytoclipboard2 = /** @type {(inputs: Recovery_Copytoclipboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy to Clipboard`)
};

const es_recovery_copytoclipboard2 = /** @type {(inputs: Recovery_Copytoclipboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar al portapapeles`)
};

const fr_recovery_copytoclipboard2 = /** @type {(inputs: Recovery_Copytoclipboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier dans le presse-papiers`)
};

const ar_recovery_copytoclipboard2 = /** @type {(inputs: Recovery_Copytoclipboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Copy to Clipboard" |
*
* @param {Recovery_Copytoclipboard2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_copytoclipboard2 = /** @type {((inputs?: Recovery_Copytoclipboard2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Copytoclipboard2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_copytoclipboard2(inputs)
	if (locale === "es") return es_recovery_copytoclipboard2(inputs)
	if (locale === "fr") return fr_recovery_copytoclipboard2(inputs)
	return ar_recovery_copytoclipboard2(inputs)
});
export { recovery_copytoclipboard2 as "recovery.copyToClipboard" }