/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Nopendingconnections3Inputs */

const en_addressbook_nopendingconnections3 = /** @type {(inputs: Addressbook_Nopendingconnections3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pending connections yet.`)
};

const es_addressbook_nopendingconnections3 = /** @type {(inputs: Addressbook_Nopendingconnections3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún sin conexiones pendientes.`)
};

const fr_addressbook_nopendingconnections3 = /** @type {(inputs: Addressbook_Nopendingconnections3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion en attente pour l'instant.`)
};

const ar_addressbook_nopendingconnections3 = /** @type {(inputs: Addressbook_Nopendingconnections3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pending connections yet.`)
};

/**
* | output |
* | --- |
* | "No pending connections yet." |
*
* @param {Addressbook_Nopendingconnections3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_nopendingconnections3 = /** @type {((inputs?: Addressbook_Nopendingconnections3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Nopendingconnections3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_nopendingconnections3(inputs)
	if (locale === "es") return es_addressbook_nopendingconnections3(inputs)
	if (locale === "fr") return fr_addressbook_nopendingconnections3(inputs)
	return ar_addressbook_nopendingconnections3(inputs)
});
export { addressbook_nopendingconnections3 as "addressBook.noPendingConnections" }