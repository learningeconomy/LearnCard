/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Scancode1Inputs */

const en_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan Code`)
};

const es_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear código`)
};

const fr_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner le code`)
};

const ar_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح الكود`)
};

/**
* | output |
* | --- |
* | "Scan Code" |
*
* @param {Contacts_Scancode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_scancode1 = /** @type {((inputs?: Contacts_Scancode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Scancode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_scancode1(inputs)
	if (locale === "es") return es_contacts_scancode1(inputs)
	if (locale === "fr") return fr_contacts_scancode1(inputs)
	return ar_contacts_scancode1(inputs)
});
export { contacts_scancode1 as "contacts.scanCode" }