/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Share1Inputs */

const en_credentialstorage_share1 = /** @type {(inputs: Credentialstorage_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share`)
};

const es_credentialstorage_share1 = /** @type {(inputs: Credentialstorage_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir`)
};

const fr_credentialstorage_share1 = /** @type {(inputs: Credentialstorage_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager`)
};

const ar_credentialstorage_share1 = /** @type {(inputs: Credentialstorage_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة`)
};

/**
* | output |
* | --- |
* | "Share" |
*
* @param {Credentialstorage_Share1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_share1 = /** @type {((inputs?: Credentialstorage_Share1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Share1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_share1(inputs)
	if (locale === "es") return es_credentialstorage_share1(inputs)
	if (locale === "fr") return fr_credentialstorage_share1(inputs)
	return ar_credentialstorage_share1(inputs)
});
export { credentialstorage_share1 as "credentialStorage.share" }