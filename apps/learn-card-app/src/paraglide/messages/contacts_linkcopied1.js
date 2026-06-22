/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Linkcopied1Inputs */

const en_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact link copied to clipboard`)
};

const es_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de contacto copiado al portapapeles`)
};

const fr_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de contact copié dans le presse-papiers`)
};

const ar_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط جهة الاتصال إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Contact link copied to clipboard" |
*
* @param {Contacts_Linkcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_linkcopied1 = /** @type {((inputs?: Contacts_Linkcopied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Linkcopied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_linkcopied1(inputs)
	if (locale === "es") return es_contacts_linkcopied1(inputs)
	if (locale === "fr") return fr_contacts_linkcopied1(inputs)
	return ar_contacts_linkcopied1(inputs)
});
export { contacts_linkcopied1 as "contacts.linkCopied" }