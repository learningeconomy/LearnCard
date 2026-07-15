/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Nosearchresults3Inputs */

const en_addressbook_nosearchresults3 = /** @type {(inputs: Addressbook_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Search Results`)
};

const es_addressbook_nosearchresults3 = /** @type {(inputs: Addressbook_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin Resultados`)
};

const fr_addressbook_nosearchresults3 = /** @type {(inputs: Addressbook_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat de recherche`)
};

const ar_addressbook_nosearchresults3 = /** @type {(inputs: Addressbook_Nosearchresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Search Results`)
};

/**
* | output |
* | --- |
* | "No Search Results" |
*
* @param {Addressbook_Nosearchresults3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_nosearchresults3 = /** @type {((inputs?: Addressbook_Nosearchresults3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Nosearchresults3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_nosearchresults3(inputs)
	if (locale === "es") return es_addressbook_nosearchresults3(inputs)
	if (locale === "fr") return fr_addressbook_nosearchresults3(inputs)
	return ar_addressbook_nosearchresults3(inputs)
});
export { addressbook_nosearchresults3 as "addressBook.noSearchResults" }