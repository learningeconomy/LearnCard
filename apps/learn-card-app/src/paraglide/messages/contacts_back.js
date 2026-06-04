/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_BackInputs */

const en_contacts_back = /** @type {(inputs: Contacts_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_contacts_back = /** @type {(inputs: Contacts_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const de_contacts_back = /** @type {(inputs: Contacts_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurück`)
};

const ar_contacts_back = /** @type {(inputs: Contacts_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

const fr_contacts_back = /** @type {(inputs: Contacts_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ko_contacts_back = /** @type {(inputs: Contacts_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`뒤로`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Contacts_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_back = /** @type {((inputs?: Contacts_BackInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_BackInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_back(inputs)
	if (locale === "es") return es_contacts_back(inputs)
	if (locale === "de") return de_contacts_back(inputs)
	if (locale === "ar") return ar_contacts_back(inputs)
	if (locale === "fr") return fr_contacts_back(inputs)
	return ko_contacts_back(inputs)
});
export { contacts_back as "contacts.back" }