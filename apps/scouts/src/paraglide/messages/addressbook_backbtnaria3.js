/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Backbtnaria3Inputs */

const en_addressbook_backbtnaria3 = /** @type {(inputs: Addressbook_Backbtnaria3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back button`)
};

const es_addressbook_backbtnaria3 = /** @type {(inputs: Addressbook_Backbtnaria3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Botón de retroceso`)
};

const fr_addressbook_backbtnaria3 = /** @type {(inputs: Addressbook_Backbtnaria3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bouton retour`)
};

const ar_addressbook_backbtnaria3 = /** @type {(inputs: Addressbook_Backbtnaria3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زر الرجوع`)
};

/**
* | output |
* | --- |
* | "Back button" |
*
* @param {Addressbook_Backbtnaria3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_backbtnaria3 = /** @type {((inputs?: Addressbook_Backbtnaria3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Backbtnaria3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_backbtnaria3(inputs)
	if (locale === "es") return es_addressbook_backbtnaria3(inputs)
	if (locale === "fr") return fr_addressbook_backbtnaria3(inputs)
	return ar_addressbook_backbtnaria3(inputs)
});
export { addressbook_backbtnaria3 as "addressBook.backBtnAria" }