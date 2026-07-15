/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Unabletoconnect3Inputs */

const en_addressbook_toasts_unabletoconnect3 = /** @type {(inputs: Addressbook_Toasts_Unabletoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error ocurred, unable to connect!`)
};

const es_addressbook_toasts_unabletoconnect3 = /** @type {(inputs: Addressbook_Toasts_Unabletoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo conectar.`)
};

const fr_addressbook_toasts_unabletoconnect3 = /** @type {(inputs: Addressbook_Toasts_Unabletoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue, impossible de se connecter !`)
};

const ar_addressbook_toasts_unabletoconnect3 = /** @type {(inputs: Addressbook_Toasts_Unabletoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error ocurred, unable to connect!`)
};

/**
* | output |
* | --- |
* | "An error ocurred, unable to connect!" |
*
* @param {Addressbook_Toasts_Unabletoconnect3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_unabletoconnect3 = /** @type {((inputs?: Addressbook_Toasts_Unabletoconnect3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Unabletoconnect3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_unabletoconnect3(inputs)
	if (locale === "es") return es_addressbook_toasts_unabletoconnect3(inputs)
	if (locale === "fr") return fr_addressbook_toasts_unabletoconnect3(inputs)
	return ar_addressbook_toasts_unabletoconnect3(inputs)
});
export { addressbook_toasts_unabletoconnect3 as "addressBook.toasts.unableToConnect" }