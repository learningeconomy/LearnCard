/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_RetryInputs */

const en_error_retry = /** @type {(inputs: Error_RetryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Try Again`)
};

const es_error_retry = /** @type {(inputs: Error_RetryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intentar de nuevo`)
};

const de_error_retry = /** @type {(inputs: Error_RetryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erneut versuchen`)
};

const ar_error_retry = /** @type {(inputs: Error_RetryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة المحاولة`)
};

const fr_error_retry = /** @type {(inputs: Error_RetryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réessayer`)
};

const ko_error_retry = /** @type {(inputs: Error_RetryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다시 시도`)
};

/**
* | output |
* | --- |
* | "Try Again" |
*
* @param {Error_RetryInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const error_retry = /** @type {((inputs?: Error_RetryInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_RetryInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_retry(inputs)
	if (locale === "es") return es_error_retry(inputs)
	if (locale === "de") return de_error_retry(inputs)
	if (locale === "ar") return ar_error_retry(inputs)
	if (locale === "fr") return fr_error_retry(inputs)
	return ko_error_retry(inputs)
});
export { error_retry as "error.retry" }