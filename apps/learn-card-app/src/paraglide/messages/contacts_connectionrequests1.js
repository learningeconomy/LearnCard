/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Connectionrequests1Inputs */

const en_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection Requests`)
};

const es_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitudes de conexión`)
};

const fr_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demandes de connexion`)
};

const ar_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات الاتصال`)
};

/**
* | output |
* | --- |
* | "Connection Requests" |
*
* @param {Contacts_Connectionrequests1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_connectionrequests1 = /** @type {((inputs?: Contacts_Connectionrequests1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectionrequests1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectionrequests1(inputs)
	if (locale === "es") return es_contacts_connectionrequests1(inputs)
	if (locale === "fr") return fr_contacts_connectionrequests1(inputs)
	return ar_contacts_connectionrequests1(inputs)
});
export { contacts_connectionrequests1 as "contacts.connectionRequests" }