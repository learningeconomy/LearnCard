/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Pendingrequest2Inputs */

const en_addressbook_pendingrequest2 = /** @type {(inputs: Addressbook_Pendingrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending request`)
};

const es_addressbook_pendingrequest2 = /** @type {(inputs: Addressbook_Pendingrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud pendiente`)
};

const fr_addressbook_pendingrequest2 = /** @type {(inputs: Addressbook_Pendingrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande en attente`)
};

const ar_addressbook_pendingrequest2 = /** @type {(inputs: Addressbook_Pendingrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب معلق`)
};

/**
* | output |
* | --- |
* | "Pending request" |
*
* @param {Addressbook_Pendingrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_pendingrequest2 = /** @type {((inputs?: Addressbook_Pendingrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Pendingrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_pendingrequest2(inputs)
	if (locale === "es") return es_addressbook_pendingrequest2(inputs)
	if (locale === "fr") return fr_addressbook_pendingrequest2(inputs)
	return ar_addressbook_pendingrequest2(inputs)
});
export { addressbook_pendingrequest2 as "addressBook.pendingRequest" }