/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Didcopied2Inputs */

const en_addressbook_toasts_didcopied2 = /** @type {(inputs: Addressbook_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copied to clipboard`)
};

const es_addressbook_toasts_didcopied2 = /** @type {(inputs: Addressbook_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copiado al portapapeles`)
};

const fr_addressbook_toasts_didcopied2 = /** @type {(inputs: Addressbook_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copié dans le presse-papiers`)
};

const ar_addressbook_toasts_didcopied2 = /** @type {(inputs: Addressbook_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ DID إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "DID copied to clipboard" |
*
* @param {Addressbook_Toasts_Didcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_didcopied2 = /** @type {((inputs?: Addressbook_Toasts_Didcopied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Didcopied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_didcopied2(inputs)
	if (locale === "es") return es_addressbook_toasts_didcopied2(inputs)
	if (locale === "fr") return fr_addressbook_toasts_didcopied2(inputs)
	return ar_addressbook_toasts_didcopied2(inputs)
});
export { addressbook_toasts_didcopied2 as "addressBook.toasts.didCopied" }