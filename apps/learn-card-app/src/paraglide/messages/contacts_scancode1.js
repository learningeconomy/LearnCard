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

const de_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code scannen`)
};

const ar_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح الكود`)
};

const fr_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner le code`)
};

const ko_contacts_scancode1 = /** @type {(inputs: Contacts_Scancode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 스캔`)
};

/**
* | output |
* | --- |
* | "Scan Code" |
*
* @param {Contacts_Scancode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_scancode1 = /** @type {((inputs?: Contacts_Scancode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Scancode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_scancode1(inputs)
	if (locale === "es") return es_contacts_scancode1(inputs)
	if (locale === "de") return de_contacts_scancode1(inputs)
	if (locale === "ar") return ar_contacts_scancode1(inputs)
	if (locale === "fr") return fr_contacts_scancode1(inputs)
	return ko_contacts_scancode1(inputs)
});
export { contacts_scancode1 as "contacts.scanCode" }