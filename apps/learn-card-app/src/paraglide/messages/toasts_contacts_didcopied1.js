/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Didcopied1Inputs */

const en_toasts_contacts_didcopied1 = /** @type {(inputs: Toasts_Contacts_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copied to clipboard`)
};

const es_toasts_contacts_didcopied1 = /** @type {(inputs: Toasts_Contacts_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copiado al portapapeles`)
};

const de_toasts_contacts_didcopied1 = /** @type {(inputs: Toasts_Contacts_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID in die Zwischenablage kopiert`)
};

const ar_toasts_contacts_didcopied1 = /** @type {(inputs: Toasts_Contacts_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ DID إلى الحافظة`)
};

const fr_toasts_contacts_didcopied1 = /** @type {(inputs: Toasts_Contacts_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copié dans le presse-papiers`)
};

const ko_toasts_contacts_didcopied1 = /** @type {(inputs: Toasts_Contacts_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID가 클립보드에 복사됨`)
};

/**
* | output |
* | --- |
* | "DID copied to clipboard" |
*
* @param {Toasts_Contacts_Didcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_didcopied1 = /** @type {((inputs?: Toasts_Contacts_Didcopied1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Didcopied1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_didcopied1(inputs)
	if (locale === "es") return es_toasts_contacts_didcopied1(inputs)
	if (locale === "de") return de_toasts_contacts_didcopied1(inputs)
	if (locale === "ar") return ar_toasts_contacts_didcopied1(inputs)
	if (locale === "fr") return fr_toasts_contacts_didcopied1(inputs)
	return ko_toasts_contacts_didcopied1(inputs)
});
export { toasts_contacts_didcopied1 as "toasts.contacts.didCopied" }