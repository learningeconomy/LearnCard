/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Unabletocopydid4Inputs */

const en_addressbook_toasts_unabletocopydid4 = /** @type {(inputs: Addressbook_Toasts_Unabletocopydid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy DID to clipboard`)
};

const es_addressbook_toasts_unabletocopydid4 = /** @type {(inputs: Addressbook_Toasts_Unabletocopydid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el DID al portapapeles`)
};

const fr_addressbook_toasts_unabletocopydid4 = /** @type {(inputs: Addressbook_Toasts_Unabletocopydid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le DID dans le presse-papiers`)
};

const ar_addressbook_toasts_unabletocopydid4 = /** @type {(inputs: Addressbook_Toasts_Unabletocopydid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ DID إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy DID to clipboard" |
*
* @param {Addressbook_Toasts_Unabletocopydid4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_unabletocopydid4 = /** @type {((inputs?: Addressbook_Toasts_Unabletocopydid4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Unabletocopydid4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_unabletocopydid4(inputs)
	if (locale === "es") return es_addressbook_toasts_unabletocopydid4(inputs)
	if (locale === "fr") return fr_addressbook_toasts_unabletocopydid4(inputs)
	return ar_addressbook_toasts_unabletocopydid4(inputs)
});
export { addressbook_toasts_unabletocopydid4 as "addressBook.toasts.unableToCopyDid" }