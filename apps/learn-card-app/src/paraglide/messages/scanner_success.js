/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_SuccessInputs */

const en_scanner_success = /** @type {(inputs: Scanner_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential imported successfully!`)
};

const es_scanner_success = /** @type {(inputs: Scanner_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial importada exitosamente!`)
};

const fr_scanner_success = /** @type {(inputs: Scanner_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre importé avec succès !`)
};

const ar_scanner_success = /** @type {(inputs: Scanner_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم استيراد الشهادة بنجاح!`)
};

/**
* | output |
* | --- |
* | "Credential imported successfully!" |
*
* @param {Scanner_SuccessInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_success = /** @type {((inputs?: Scanner_SuccessInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_SuccessInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_success(inputs)
	if (locale === "es") return es_scanner_success(inputs)
	if (locale === "fr") return fr_scanner_success(inputs)
	return ar_scanner_success(inputs)
});
export { scanner_success as "scanner.success" }