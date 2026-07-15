/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Acceptrequest2Inputs */

const en_addressbook_acceptrequest2 = /** @type {(inputs: Addressbook_Acceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept Request`)
};

const es_addressbook_acceptrequest2 = /** @type {(inputs: Addressbook_Acceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar Solicitud`)
};

const fr_addressbook_acceptrequest2 = /** @type {(inputs: Addressbook_Acceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter la demande`)
};

const ar_addressbook_acceptrequest2 = /** @type {(inputs: Addressbook_Acceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept Request`)
};

/**
* | output |
* | --- |
* | "Accept Request" |
*
* @param {Addressbook_Acceptrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_acceptrequest2 = /** @type {((inputs?: Addressbook_Acceptrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Acceptrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_acceptrequest2(inputs)
	if (locale === "es") return es_addressbook_acceptrequest2(inputs)
	if (locale === "fr") return fr_addressbook_acceptrequest2(inputs)
	return ar_addressbook_acceptrequest2(inputs)
});
export { addressbook_acceptrequest2 as "addressBook.acceptRequest" }