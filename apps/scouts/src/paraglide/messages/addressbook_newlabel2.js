/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Newlabel2Inputs */

const en_addressbook_newlabel2 = /** @type {(inputs: Addressbook_Newlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New`)
};

const es_addressbook_newlabel2 = /** @type {(inputs: Addressbook_Newlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo`)
};

const fr_addressbook_newlabel2 = /** @type {(inputs: Addressbook_Newlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau`)
};

const ar_addressbook_newlabel2 = /** @type {(inputs: Addressbook_Newlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جديد`)
};

/**
* | output |
* | --- |
* | "New" |
*
* @param {Addressbook_Newlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_newlabel2 = /** @type {((inputs?: Addressbook_Newlabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Newlabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_newlabel2(inputs)
	if (locale === "es") return es_addressbook_newlabel2(inputs)
	if (locale === "fr") return fr_addressbook_newlabel2(inputs)
	return ar_addressbook_newlabel2(inputs)
});
export { addressbook_newlabel2 as "addressBook.newLabel" }