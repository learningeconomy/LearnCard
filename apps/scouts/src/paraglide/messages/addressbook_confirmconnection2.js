/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Confirmconnection2Inputs */

const en_addressbook_confirmconnection2 = /** @type {(inputs: Addressbook_Confirmconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to send a connection request?`)
};

const es_addressbook_confirmconnection2 = /** @type {(inputs: Addressbook_Confirmconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres enviar una solicitud de conexión?`)
};

const fr_addressbook_confirmconnection2 = /** @type {(inputs: Addressbook_Confirmconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir envoyer une demande de connexion ?`)
};

const ar_addressbook_confirmconnection2 = /** @type {(inputs: Addressbook_Confirmconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to send a connection request?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to send a connection request?" |
*
* @param {Addressbook_Confirmconnection2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_confirmconnection2 = /** @type {((inputs?: Addressbook_Confirmconnection2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Confirmconnection2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_confirmconnection2(inputs)
	if (locale === "es") return es_addressbook_confirmconnection2(inputs)
	if (locale === "fr") return fr_addressbook_confirmconnection2(inputs)
	return ar_addressbook_confirmconnection2(inputs)
});
export { addressbook_confirmconnection2 as "addressBook.confirmConnection" }