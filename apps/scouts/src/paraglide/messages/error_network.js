/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_NetworkInputs */

const en_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection issue. Please check your internet and try again.`)
};

const es_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problema de conexión. Verifica tu internet e inténtalo de nuevo.`)
};

const fr_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problème de connexion. Veuillez vérifier votre connexion internet et réessayer.`)
};

const ar_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشكلة في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Connection issue. Please check your internet and try again." |
*
* @param {Error_NetworkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const error_network = /** @type {((inputs?: Error_NetworkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_NetworkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_network(inputs)
	if (locale === "es") return es_error_network(inputs)
	if (locale === "fr") return fr_error_network(inputs)
	return ar_error_network(inputs)
});
export { error_network as "error.network" }