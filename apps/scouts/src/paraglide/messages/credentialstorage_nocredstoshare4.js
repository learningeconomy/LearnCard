/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Nocredstoshare4Inputs */

const en_credentialstorage_nocredstoshare4 = /** @type {(inputs: Credentialstorage_Nocredstoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials to share.`)
};

const es_credentialstorage_nocredstoshare4 = /** @type {(inputs: Credentialstorage_Nocredstoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay credenciales para compartir.`)
};

const fr_credentialstorage_nocredstoshare4 = /** @type {(inputs: Credentialstorage_Nocredstoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun justificatif à partager.`)
};

const ar_credentialstorage_nocredstoshare4 = /** @type {(inputs: Credentialstorage_Nocredstoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials to share.`)
};

/**
* | output |
* | --- |
* | "No credentials to share." |
*
* @param {Credentialstorage_Nocredstoshare4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_nocredstoshare4 = /** @type {((inputs?: Credentialstorage_Nocredstoshare4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Nocredstoshare4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_nocredstoshare4(inputs)
	if (locale === "es") return es_credentialstorage_nocredstoshare4(inputs)
	if (locale === "fr") return fr_credentialstorage_nocredstoshare4(inputs)
	return ar_credentialstorage_nocredstoshare4(inputs)
});
export { credentialstorage_nocredstoshare4 as "credentialStorage.noCredsToShare" }