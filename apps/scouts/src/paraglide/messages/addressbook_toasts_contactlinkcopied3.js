/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Contactlinkcopied3Inputs */

const en_addressbook_toasts_contactlinkcopied3 = /** @type {(inputs: Addressbook_Toasts_Contactlinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact link copied to clipboard`)
};

const es_addressbook_toasts_contactlinkcopied3 = /** @type {(inputs: Addressbook_Toasts_Contactlinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de contacto copiado al portapapeles`)
};

const fr_addressbook_toasts_contactlinkcopied3 = /** @type {(inputs: Addressbook_Toasts_Contactlinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de contact copié dans le presse-papiers`)
};

const ar_addressbook_toasts_contactlinkcopied3 = /** @type {(inputs: Addressbook_Toasts_Contactlinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط الاتصال إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Contact link copied to clipboard" |
*
* @param {Addressbook_Toasts_Contactlinkcopied3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_contactlinkcopied3 = /** @type {((inputs?: Addressbook_Toasts_Contactlinkcopied3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Contactlinkcopied3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_contactlinkcopied3(inputs)
	if (locale === "es") return es_addressbook_toasts_contactlinkcopied3(inputs)
	if (locale === "fr") return fr_addressbook_toasts_contactlinkcopied3(inputs)
	return ar_addressbook_toasts_contactlinkcopied3(inputs)
});
export { addressbook_toasts_contactlinkcopied3 as "addressBook.toasts.contactLinkCopied" }