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

const de_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindungsanfragen`)
};

const ar_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات الاتصال`)
};

const fr_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demandes de connexion`)
};

const ko_contacts_connectionrequests1 = /** @type {(inputs: Contacts_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 요청`)
};

/**
* | output |
* | --- |
* | "Connection Requests" |
*
* @param {Contacts_Connectionrequests1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_connectionrequests1 = /** @type {((inputs?: Contacts_Connectionrequests1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectionrequests1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectionrequests1(inputs)
	if (locale === "es") return es_contacts_connectionrequests1(inputs)
	if (locale === "de") return de_contacts_connectionrequests1(inputs)
	if (locale === "ar") return ar_contacts_connectionrequests1(inputs)
	if (locale === "fr") return fr_contacts_connectionrequests1(inputs)
	return ko_contacts_connectionrequests1(inputs)
});
export { contacts_connectionrequests1 as "contacts.connectionRequests" }