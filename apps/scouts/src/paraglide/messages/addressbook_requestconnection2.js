/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Requestconnection2Inputs */

const en_addressbook_requestconnection2 = /** @type {(inputs: Addressbook_Requestconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Connection`)
};

const es_addressbook_requestconnection2 = /** @type {(inputs: Addressbook_Requestconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Conexión`)
};

const fr_addressbook_requestconnection2 = /** @type {(inputs: Addressbook_Requestconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander la connexion`)
};

const ar_addressbook_requestconnection2 = /** @type {(inputs: Addressbook_Requestconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب اتصال`)
};

/**
* | output |
* | --- |
* | "Request Connection" |
*
* @param {Addressbook_Requestconnection2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_requestconnection2 = /** @type {((inputs?: Addressbook_Requestconnection2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Requestconnection2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_requestconnection2(inputs)
	if (locale === "es") return es_addressbook_requestconnection2(inputs)
	if (locale === "fr") return fr_addressbook_requestconnection2(inputs)
	return ar_addressbook_requestconnection2(inputs)
});
export { addressbook_requestconnection2 as "addressBook.requestConnection" }