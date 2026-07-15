/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Noconnectionrequests3Inputs */

const en_addressbook_noconnectionrequests3 = /** @type {(inputs: Addressbook_Noconnectionrequests3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No connection requests yet.`)
};

const es_addressbook_noconnectionrequests3 = /** @type {(inputs: Addressbook_Noconnectionrequests3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún sin solicitudes de conexión.`)
};

const fr_addressbook_noconnectionrequests3 = /** @type {(inputs: Addressbook_Noconnectionrequests3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune demande de connexion pour l'instant.`)
};

const ar_addressbook_noconnectionrequests3 = /** @type {(inputs: Addressbook_Noconnectionrequests3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد طلبات اتصال بعد.`)
};

/**
* | output |
* | --- |
* | "No connection requests yet." |
*
* @param {Addressbook_Noconnectionrequests3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_noconnectionrequests3 = /** @type {((inputs?: Addressbook_Noconnectionrequests3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Noconnectionrequests3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_noconnectionrequests3(inputs)
	if (locale === "es") return es_addressbook_noconnectionrequests3(inputs)
	if (locale === "fr") return fr_addressbook_noconnectionrequests3(inputs)
	return ar_addressbook_noconnectionrequests3(inputs)
});
export { addressbook_noconnectionrequests3 as "addressBook.noConnectionRequests" }