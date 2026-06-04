/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Pendingconnections1Inputs */

const en_contacts_pendingconnections1 = /** @type {(inputs: Contacts_Pendingconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending`)
};

const es_contacts_pendingconnections1 = /** @type {(inputs: Contacts_Pendingconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pendientes`)
};

const de_contacts_pendingconnections1 = /** @type {(inputs: Contacts_Pendingconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausstehend`)
};

const ar_contacts_pendingconnections1 = /** @type {(inputs: Contacts_Pendingconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معلق`)
};

const fr_contacts_pendingconnections1 = /** @type {(inputs: Contacts_Pendingconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

const ko_contacts_pendingconnections1 = /** @type {(inputs: Contacts_Pendingconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`대기 중`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Contacts_Pendingconnections1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_pendingconnections1 = /** @type {((inputs?: Contacts_Pendingconnections1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Pendingconnections1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_pendingconnections1(inputs)
	if (locale === "es") return es_contacts_pendingconnections1(inputs)
	if (locale === "de") return de_contacts_pendingconnections1(inputs)
	if (locale === "ar") return ar_contacts_pendingconnections1(inputs)
	if (locale === "fr") return fr_contacts_pendingconnections1(inputs)
	return ko_contacts_pendingconnections1(inputs)
});
export { contacts_pendingconnections1 as "contacts.pendingConnections" }