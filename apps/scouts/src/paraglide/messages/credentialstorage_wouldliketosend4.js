/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Wouldliketosend4Inputs */

const en_credentialstorage_wouldliketosend4 = /** @type {(inputs: Credentialstorage_Wouldliketosend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{origin} would like to send you a credential?`)
};

const es_credentialstorage_wouldliketosend4 = /** @type {(inputs: Credentialstorage_Wouldliketosend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{origin} te gustaría enviarte una credencial`)
};

const fr_credentialstorage_wouldliketosend4 = /** @type {(inputs: Credentialstorage_Wouldliketosend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{origin} souhaite vous envoyer un justificatif ?`)
};

const ar_credentialstorage_wouldliketosend4 = /** @type {(inputs: Credentialstorage_Wouldliketosend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{origin} would like to send you a credential?`)
};

/**
* | output |
* | --- |
* | "{origin} would like to send you a credential?" |
*
* @param {Credentialstorage_Wouldliketosend4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_wouldliketosend4 = /** @type {((inputs?: Credentialstorage_Wouldliketosend4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Wouldliketosend4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_wouldliketosend4(inputs)
	if (locale === "es") return es_credentialstorage_wouldliketosend4(inputs)
	if (locale === "fr") return fr_credentialstorage_wouldliketosend4(inputs)
	return ar_credentialstorage_wouldliketosend4(inputs)
});
export { credentialstorage_wouldliketosend4 as "credentialStorage.wouldLikeToSend" }