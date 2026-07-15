/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credentialstorage_Cancel1Inputs */

const en_credentialstorage_cancel1 = /** @type {(inputs: Credentialstorage_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_credentialstorage_cancel1 = /** @type {(inputs: Credentialstorage_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const fr_credentialstorage_cancel1 = /** @type {(inputs: Credentialstorage_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ar_credentialstorage_cancel1 = /** @type {(inputs: Credentialstorage_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Credentialstorage_Cancel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credentialstorage_cancel1 = /** @type {((inputs?: Credentialstorage_Cancel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credentialstorage_Cancel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credentialstorage_cancel1(inputs)
	if (locale === "es") return es_credentialstorage_cancel1(inputs)
	if (locale === "fr") return fr_credentialstorage_cancel1(inputs)
	return ar_credentialstorage_cancel1(inputs)
});
export { credentialstorage_cancel1 as "credentialStorage.cancel" }