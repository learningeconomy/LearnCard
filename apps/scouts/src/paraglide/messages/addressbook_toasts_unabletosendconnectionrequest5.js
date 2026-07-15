/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Unabletosendconnectionrequest5Inputs */

const en_addressbook_toasts_unabletosendconnectionrequest5 = /** @type {(inputs: Addressbook_Toasts_Unabletosendconnectionrequest5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error ocurred, unable to send connection request.`)
};

const es_addressbook_toasts_unabletosendconnectionrequest5 = /** @type {(inputs: Addressbook_Toasts_Unabletosendconnectionrequest5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo enviar la solicitud de conexión.`)
};

const fr_addressbook_toasts_unabletosendconnectionrequest5 = /** @type {(inputs: Addressbook_Toasts_Unabletosendconnectionrequest5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue, impossible d'envoyer la demande de connexion.`)
};

const ar_addressbook_toasts_unabletosendconnectionrequest5 = /** @type {(inputs: Addressbook_Toasts_Unabletosendconnectionrequest5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error ocurred, unable to send connection request.`)
};

/**
* | output |
* | --- |
* | "An error ocurred, unable to send connection request." |
*
* @param {Addressbook_Toasts_Unabletosendconnectionrequest5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_unabletosendconnectionrequest5 = /** @type {((inputs?: Addressbook_Toasts_Unabletosendconnectionrequest5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Unabletosendconnectionrequest5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_unabletosendconnectionrequest5(inputs)
	if (locale === "es") return es_addressbook_toasts_unabletosendconnectionrequest5(inputs)
	if (locale === "fr") return fr_addressbook_toasts_unabletosendconnectionrequest5(inputs)
	return ar_addressbook_toasts_unabletosendconnectionrequest5(inputs)
});
export { addressbook_toasts_unabletosendconnectionrequest5 as "addressBook.toasts.unableToSendConnectionRequest" }