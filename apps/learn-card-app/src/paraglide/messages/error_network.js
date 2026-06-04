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

const de_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindungsproblem. Bitte prüfe deine Internetverbindung und versuche es erneut.`)
};

const ar_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشكلة في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.`)
};

const fr_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problème de connexion. Veuillez vérifier votre connexion internet et réessayer.`)
};

const ko_error_network = /** @type {(inputs: Error_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 문제입니다. 인터넷을 확인하고 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Connection issue. Please check your internet and try again." |
*
* @param {Error_NetworkInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const error_network = /** @type {((inputs?: Error_NetworkInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_NetworkInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_network(inputs)
	if (locale === "es") return es_error_network(inputs)
	if (locale === "de") return de_error_network(inputs)
	if (locale === "ar") return ar_error_network(inputs)
	if (locale === "fr") return fr_error_network(inputs)
	return ko_error_network(inputs)
});
export { error_network as "error.network" }