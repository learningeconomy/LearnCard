/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Unabletocopycontactlink5Inputs */

const en_addressbook_toasts_unabletocopycontactlink5 = /** @type {(inputs: Addressbook_Toasts_Unabletocopycontactlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Contact link to clipboard`)
};

const es_addressbook_toasts_unabletocopycontactlink5 = /** @type {(inputs: Addressbook_Toasts_Unabletocopycontactlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de contacto`)
};

const fr_addressbook_toasts_unabletocopycontactlink5 = /** @type {(inputs: Addressbook_Toasts_Unabletocopycontactlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de contact dans le presse-papiers`)
};

const ar_addressbook_toasts_unabletocopycontactlink5 = /** @type {(inputs: Addressbook_Toasts_Unabletocopycontactlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Contact link to clipboard`)
};

/**
* | output |
* | --- |
* | "Unable to copy Contact link to clipboard" |
*
* @param {Addressbook_Toasts_Unabletocopycontactlink5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_unabletocopycontactlink5 = /** @type {((inputs?: Addressbook_Toasts_Unabletocopycontactlink5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Unabletocopycontactlink5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_unabletocopycontactlink5(inputs)
	if (locale === "es") return es_addressbook_toasts_unabletocopycontactlink5(inputs)
	if (locale === "fr") return fr_addressbook_toasts_unabletocopycontactlink5(inputs)
	return ar_addressbook_toasts_unabletocopycontactlink5(inputs)
});
export { addressbook_toasts_unabletocopycontactlink5 as "addressBook.toasts.unableToCopyContactLink" }