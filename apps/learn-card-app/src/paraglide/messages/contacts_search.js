/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_SearchInputs */

const en_contacts_search = /** @type {(inputs: Contacts_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search`)
};

const es_contacts_search = /** @type {(inputs: Contacts_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar`)
};

const de_contacts_search = /** @type {(inputs: Contacts_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suchen`)
};

const ar_contacts_search = /** @type {(inputs: Contacts_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحث`)
};

const fr_contacts_search = /** @type {(inputs: Contacts_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher`)
};

const ko_contacts_search = /** @type {(inputs: Contacts_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검색`)
};

/**
* | output |
* | --- |
* | "Search" |
*
* @param {Contacts_SearchInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_search = /** @type {((inputs?: Contacts_SearchInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_SearchInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_search(inputs)
	if (locale === "es") return es_contacts_search(inputs)
	if (locale === "de") return de_contacts_search(inputs)
	if (locale === "ar") return ar_contacts_search(inputs)
	if (locale === "fr") return fr_contacts_search(inputs)
	return ko_contacts_search(inputs)
});
export { contacts_search as "contacts.search" }