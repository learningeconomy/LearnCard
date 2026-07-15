/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Scancodedesc3Inputs */

const en_addressbook_scancodedesc3 = /** @type {(inputs: Addressbook_Scancodedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Have your contact scan this code.`)
};

const es_addressbook_scancodedesc3 = /** @type {(inputs: Addressbook_Scancodedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz que tu contacto escanee este código.`)
};

const fr_addressbook_scancodedesc3 = /** @type {(inputs: Addressbook_Scancodedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demandez à votre contact de scanner ce code.`)
};

const ar_addressbook_scancodedesc3 = /** @type {(inputs: Addressbook_Scancodedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Have your contact scan this code.`)
};

/**
* | output |
* | --- |
* | "Have your contact scan this code." |
*
* @param {Addressbook_Scancodedesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_scancodedesc3 = /** @type {((inputs?: Addressbook_Scancodedesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Scancodedesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_scancodedesc3(inputs)
	if (locale === "es") return es_addressbook_scancodedesc3(inputs)
	if (locale === "fr") return fr_addressbook_scancodedesc3(inputs)
	return ar_addressbook_scancodedesc3(inputs)
});
export { addressbook_scancodedesc3 as "addressBook.scanCodeDesc" }