/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Accepting1Inputs */

const en_credentialstorage_accepting1 = /** @type {(inputs: Credentialstorage_Accepting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepting...`)
};

const es_credentialstorage_accepting1 = /** @type {(inputs: Credentialstorage_Accepting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptando...`)
};

const fr_credentialstorage_accepting1 = /** @type {(inputs: Credentialstorage_Accepting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceptation en cours...`)
};

const ar_credentialstorage_accepting1 = /** @type {(inputs: Credentialstorage_Accepting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepting...`)
};

/**
* | output |
* | --- |
* | "Accepting..." |
*
* @param {Credentialstorage_Accepting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_accepting1 = /** @type {((inputs?: Credentialstorage_Accepting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Accepting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_accepting1(inputs)
	if (locale === "es") return es_credentialstorage_accepting1(inputs)
	if (locale === "fr") return fr_credentialstorage_accepting1(inputs)
	return ar_credentialstorage_accepting1(inputs)
});
export { credentialstorage_accepting1 as "credentialStorage.accepting" }