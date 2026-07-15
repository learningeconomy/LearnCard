/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Confirm1Inputs */

const en_addressbook_confirm1 = /** @type {(inputs: Addressbook_Confirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm`)
};

const es_addressbook_confirm1 = /** @type {(inputs: Addressbook_Confirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmar`)
};

const fr_addressbook_confirm1 = /** @type {(inputs: Addressbook_Confirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmer`)
};

const ar_addressbook_confirm1 = /** @type {(inputs: Addressbook_Confirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm`)
};

/**
* | output |
* | --- |
* | "Confirm" |
*
* @param {Addressbook_Confirm1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_confirm1 = /** @type {((inputs?: Addressbook_Confirm1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Confirm1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_confirm1(inputs)
	if (locale === "es") return es_addressbook_confirm1(inputs)
	if (locale === "fr") return fr_addressbook_confirm1(inputs)
	return ar_addressbook_confirm1(inputs)
});
export { addressbook_confirm1 as "addressBook.confirm" }