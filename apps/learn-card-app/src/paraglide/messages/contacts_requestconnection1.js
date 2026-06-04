/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Requestconnection1Inputs */

const en_contacts_requestconnection1 = /** @type {(inputs: Contacts_Requestconnection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Connection`)
};

const es_contacts_requestconnection1 = /** @type {(inputs: Contacts_Requestconnection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar conexión`)
};

const de_contacts_requestconnection1 = /** @type {(inputs: Contacts_Requestconnection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindung anfragen`)
};

const ar_contacts_requestconnection1 = /** @type {(inputs: Contacts_Requestconnection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب اتصال`)
};

const fr_contacts_requestconnection1 = /** @type {(inputs: Contacts_Requestconnection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander une connexion`)
};

const ko_contacts_requestconnection1 = /** @type {(inputs: Contacts_Requestconnection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 요청`)
};

/**
* | output |
* | --- |
* | "Request Connection" |
*
* @param {Contacts_Requestconnection1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_requestconnection1 = /** @type {((inputs?: Contacts_Requestconnection1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Requestconnection1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_requestconnection1(inputs)
	if (locale === "es") return es_contacts_requestconnection1(inputs)
	if (locale === "de") return de_contacts_requestconnection1(inputs)
	if (locale === "ar") return ar_contacts_requestconnection1(inputs)
	if (locale === "fr") return fr_contacts_requestconnection1(inputs)
	return ko_contacts_requestconnection1(inputs)
});
export { contacts_requestconnection1 as "contacts.requestConnection" }