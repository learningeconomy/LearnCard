/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Blockedcontacts1Inputs */

const en_contacts_blockedcontacts1 = /** @type {(inputs: Contacts_Blockedcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blocked`)
};

const es_contacts_blockedcontacts1 = /** @type {(inputs: Contacts_Blockedcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloqueados`)
};

const de_contacts_blockedcontacts1 = /** @type {(inputs: Contacts_Blockedcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blockiert`)
};

const ar_contacts_blockedcontacts1 = /** @type {(inputs: Contacts_Blockedcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`محظور`)
};

const fr_contacts_blockedcontacts1 = /** @type {(inputs: Contacts_Blockedcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloqués`)
};

const ko_contacts_blockedcontacts1 = /** @type {(inputs: Contacts_Blockedcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`차단됨`)
};

/**
* | output |
* | --- |
* | "Blocked" |
*
* @param {Contacts_Blockedcontacts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_blockedcontacts1 = /** @type {((inputs?: Contacts_Blockedcontacts1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Blockedcontacts1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_blockedcontacts1(inputs)
	if (locale === "es") return es_contacts_blockedcontacts1(inputs)
	if (locale === "de") return de_contacts_blockedcontacts1(inputs)
	if (locale === "ar") return ar_contacts_blockedcontacts1(inputs)
	if (locale === "fr") return fr_contacts_blockedcontacts1(inputs)
	return ko_contacts_blockedcontacts1(inputs)
});
export { contacts_blockedcontacts1 as "contacts.blockedContacts" }