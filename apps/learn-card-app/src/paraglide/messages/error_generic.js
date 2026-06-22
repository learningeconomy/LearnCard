/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_GenericInputs */

const en_error_generic = /** @type {(inputs: Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong. Please try again.`)
};

const es_error_generic = /** @type {(inputs: Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo salió mal. Inténtalo de nuevo.`)
};

const fr_error_generic = /** @type {(inputs: Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue. Veuillez réessayer.`)
};

const ar_error_generic = /** @type {(inputs: Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Something went wrong. Please try again." |
*
* @param {Error_GenericInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const error_generic = /** @type {((inputs?: Error_GenericInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_GenericInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_generic(inputs)
	if (locale === "es") return es_error_generic(inputs)
	if (locale === "fr") return fr_error_generic(inputs)
	return ar_error_generic(inputs)
});
export { error_generic as "error.generic" }