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

const de_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine ausstehenden Verbindungen`)
};

const ar_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد اتصالات معلقة`)
};

const fr_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion en attente`)
};

const ko_contacts_nopendingconnections2 = /** @type {(inputs: Contacts_Nopendingconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`대기 중인 연결이 없습니다`)
};

/**
* | output |
* | --- |
* | "No pending connections yet" |
*
* @param {Contacts_Nopendingconnections2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_nopendingconnections2 = /** @type {((inputs?: Contacts_Nopendingconnections2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Nopendingconnections2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_nopendingconnections2(inputs)
	if (locale === "es") return es_contacts_nopendingconnections2(inputs)
	if (locale === "de") return de_contacts_nopendingconnections2(inputs)
	if (locale === "ar") return ar_contacts_nopendingconnections2(inputs)
	if (locale === "fr") return fr_contacts_nopendingconnections2(inputs)
	return ko_contacts_nopendingconnections2(inputs)
});
export { contacts_nopendingconnections2 as "contacts.noPendingConnections" }