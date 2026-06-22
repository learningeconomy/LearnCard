/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Nopendingconnections2Inputs */

const en_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pending connections yet`)
};

const es_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay conexiones pendientes`)
};

const fr_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion en attente`)
};

const ar_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد اتصالات معلقة`)
};

/**
* | output |
* | --- |
* | "No pending connections yet" |
*
* @param {Contacts_Nopendingconnections2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_nopendingconnections2 = /** @type {((inputs?: Contacts_Nopendingconnections2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Nopendingconnections2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_nopendingconnections2(inputs)
	if (locale === "es") return es_contacts_nopendingconnections2(inputs)
	if (locale === "fr") return fr_contacts_nopendingconnections2(inputs)
	return ar_contacts_nopendingconnections2(inputs)
});
export { contacts_nopendingconnections2 as "contacts.noPendingConnections" }