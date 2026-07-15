/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Returnhome2Inputs */

const en_addressbook_returnhome2 = /** @type {(inputs: Addressbook_Returnhome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Return home`)
};

const es_addressbook_returnhome2 = /** @type {(inputs: Addressbook_Returnhome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver al inicio`)
};

const fr_addressbook_returnhome2 = /** @type {(inputs: Addressbook_Returnhome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour à l'accueil`)
};

const ar_addressbook_returnhome2 = /** @type {(inputs: Addressbook_Returnhome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Return home`)
};

/**
* | output |
* | --- |
* | "Return home" |
*
* @param {Addressbook_Returnhome2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_returnhome2 = /** @type {((inputs?: Addressbook_Returnhome2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Returnhome2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_returnhome2(inputs)
	if (locale === "es") return es_addressbook_returnhome2(inputs)
	if (locale === "fr") return fr_addressbook_returnhome2(inputs)
	return ar_addressbook_returnhome2(inputs)
});
export { addressbook_returnhome2 as "addressBook.returnHome" }