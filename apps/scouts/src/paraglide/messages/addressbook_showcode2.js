/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Showcode2Inputs */

const en_addressbook_showcode2 = /** @type {(inputs: Addressbook_Showcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show Code`)
};

const es_addressbook_showcode2 = /** @type {(inputs: Addressbook_Showcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar Código`)
};

const fr_addressbook_showcode2 = /** @type {(inputs: Addressbook_Showcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher le code`)
};

const ar_addressbook_showcode2 = /** @type {(inputs: Addressbook_Showcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار الرمز`)
};

/**
* | output |
* | --- |
* | "Show Code" |
*
* @param {Addressbook_Showcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_showcode2 = /** @type {((inputs?: Addressbook_Showcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Showcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_showcode2(inputs)
	if (locale === "es") return es_addressbook_showcode2(inputs)
	if (locale === "fr") return fr_addressbook_showcode2(inputs)
	return ar_addressbook_showcode2(inputs)
});
export { addressbook_showcode2 as "addressBook.showCode" }