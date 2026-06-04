/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Allcontacts1Inputs */

const en_contacts_allcontacts1 = /** @type {(inputs: Contacts_Allcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_contacts_allcontacts1 = /** @type {(inputs: Contacts_Allcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos`)
};

const de_contacts_allcontacts1 = /** @type {(inputs: Contacts_Allcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle`)
};

const ar_contacts_allcontacts1 = /** @type {(inputs: Contacts_Allcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

const fr_contacts_allcontacts1 = /** @type {(inputs: Contacts_Allcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous`)
};

const ko_contacts_allcontacts1 = /** @type {(inputs: Contacts_Allcontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전체`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Contacts_Allcontacts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_allcontacts1 = /** @type {((inputs?: Contacts_Allcontacts1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Allcontacts1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_allcontacts1(inputs)
	if (locale === "es") return es_contacts_allcontacts1(inputs)
	if (locale === "de") return de_contacts_allcontacts1(inputs)
	if (locale === "ar") return ar_contacts_allcontacts1(inputs)
	if (locale === "fr") return fr_contacts_allcontacts1(inputs)
	return ko_contacts_allcontacts1(inputs)
});
export { contacts_allcontacts1 as "contacts.allContacts" }