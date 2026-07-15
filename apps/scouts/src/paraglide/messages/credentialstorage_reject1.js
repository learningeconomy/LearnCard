/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Reject1Inputs */

const en_credentialstorage_reject1 = /** @type {(inputs: Credentialstorage_Reject1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reject`)
};

const es_credentialstorage_reject1 = /** @type {(inputs: Credentialstorage_Reject1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechazar`)
};

const fr_credentialstorage_reject1 = /** @type {(inputs: Credentialstorage_Reject1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refuser`)
};

const ar_credentialstorage_reject1 = /** @type {(inputs: Credentialstorage_Reject1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض`)
};

/**
* | output |
* | --- |
* | "Reject" |
*
* @param {Credentialstorage_Reject1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_reject1 = /** @type {((inputs?: Credentialstorage_Reject1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Reject1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_reject1(inputs)
	if (locale === "es") return es_credentialstorage_reject1(inputs)
	if (locale === "fr") return fr_credentialstorage_reject1(inputs)
	return ar_credentialstorage_reject1(inputs)
});
export { credentialstorage_reject1 as "credentialStorage.reject" }