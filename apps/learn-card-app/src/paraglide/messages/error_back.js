/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_BackInputs */

const en_error_back = /** @type {(inputs: Error_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go Back`)
};

const es_error_back = /** @type {(inputs: Error_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const fr_error_back = /** @type {(inputs: Error_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_error_back = /** @type {(inputs: Error_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Go Back" |
*
* @param {Error_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const error_back = /** @type {((inputs?: Error_BackInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_BackInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_back(inputs)
	if (locale === "es") return es_error_back(inputs)
	if (locale === "fr") return fr_error_back(inputs)
	return ar_error_back(inputs)
});
export { error_back as "error.back" }