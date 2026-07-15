/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Sharing1Inputs */

const en_credentialstorage_sharing1 = /** @type {(inputs: Credentialstorage_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sharing...`)
};

const es_credentialstorage_sharing1 = /** @type {(inputs: Credentialstorage_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartiendo...`)
};

const fr_credentialstorage_sharing1 = /** @type {(inputs: Credentialstorage_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partage en cours...`)
};

const ar_credentialstorage_sharing1 = /** @type {(inputs: Credentialstorage_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sharing...`)
};

/**
* | output |
* | --- |
* | "Sharing..." |
*
* @param {Credentialstorage_Sharing1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_sharing1 = /** @type {((inputs?: Credentialstorage_Sharing1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Sharing1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_sharing1(inputs)
	if (locale === "es") return es_credentialstorage_sharing1(inputs)
	if (locale === "fr") return fr_credentialstorage_sharing1(inputs)
	return ar_credentialstorage_sharing1(inputs)
});
export { credentialstorage_sharing1 as "credentialStorage.sharing" }