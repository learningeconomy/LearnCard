/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Connected1Inputs */

const en_addressbook_connected1 = /** @type {(inputs: Addressbook_Connected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected`)
};

const es_addressbook_connected1 = /** @type {(inputs: Addressbook_Connected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectado`)
};

const fr_addressbook_connected1 = /** @type {(inputs: Addressbook_Connected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecté`)
};

const ar_addressbook_connected1 = /** @type {(inputs: Addressbook_Connected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected`)
};

/**
* | output |
* | --- |
* | "Connected" |
*
* @param {Addressbook_Connected1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_connected1 = /** @type {((inputs?: Addressbook_Connected1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Connected1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_connected1(inputs)
	if (locale === "es") return es_addressbook_connected1(inputs)
	if (locale === "fr") return fr_addressbook_connected1(inputs)
	return ar_addressbook_connected1(inputs)
});
export { addressbook_connected1 as "addressBook.connected" }