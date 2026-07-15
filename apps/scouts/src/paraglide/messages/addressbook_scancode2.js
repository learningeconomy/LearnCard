/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Scancode2Inputs */

const en_addressbook_scancode2 = /** @type {(inputs: Addressbook_Scancode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan Code`)
};

const es_addressbook_scancode2 = /** @type {(inputs: Addressbook_Scancode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear Código`)
};

const fr_addressbook_scancode2 = /** @type {(inputs: Addressbook_Scancode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner le code`)
};

const ar_addressbook_scancode2 = /** @type {(inputs: Addressbook_Scancode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح الرمز`)
};

/**
* | output |
* | --- |
* | "Scan Code" |
*
* @param {Addressbook_Scancode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_scancode2 = /** @type {((inputs?: Addressbook_Scancode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Scancode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_scancode2(inputs)
	if (locale === "es") return es_addressbook_scancode2(inputs)
	if (locale === "fr") return fr_addressbook_scancode2(inputs)
	return ar_addressbook_scancode2(inputs)
});
export { addressbook_scancode2 as "addressBook.scanCode" }