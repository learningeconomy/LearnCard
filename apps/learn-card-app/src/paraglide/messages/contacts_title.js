/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_TitleInputs */

const en_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const de_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakte`)
};

const ar_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال`)
};

const fr_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ko_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Contacts_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_title = /** @type {((inputs?: Contacts_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_title(inputs)
	if (locale === "es") return es_contacts_title(inputs)
	if (locale === "de") return de_contacts_title(inputs)
	if (locale === "ar") return ar_contacts_title(inputs)
	if (locale === "fr") return fr_contacts_title(inputs)
	return ko_contacts_title(inputs)
});
export { contacts_title as "contacts.title" }