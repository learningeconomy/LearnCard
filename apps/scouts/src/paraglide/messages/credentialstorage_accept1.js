/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Accept1Inputs */

const en_credentialstorage_accept1 = /** @type {(inputs: Credentialstorage_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept`)
};

const es_credentialstorage_accept1 = /** @type {(inputs: Credentialstorage_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const fr_credentialstorage_accept1 = /** @type {(inputs: Credentialstorage_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter`)
};

const ar_credentialstorage_accept1 = /** @type {(inputs: Credentialstorage_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept`)
};

/**
* | output |
* | --- |
* | "Accept" |
*
* @param {Credentialstorage_Accept1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_accept1 = /** @type {((inputs?: Credentialstorage_Accept1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Accept1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_accept1(inputs)
	if (locale === "es") return es_credentialstorage_accept1(inputs)
	if (locale === "fr") return fr_credentialstorage_accept1(inputs)
	return ar_credentialstorage_accept1(inputs)
});
export { credentialstorage_accept1 as "credentialStorage.accept" }