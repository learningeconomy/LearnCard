/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Linkcopyfailed2Inputs */

const en_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Contact link to clipboard`)
};

const es_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de contacto`)
};

const fr_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de contact`)
};

const ar_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط جهة الاتصال`)
};

/**
* | output |
* | --- |
* | "Unable to copy Contact link to clipboard" |
*
* @param {Contacts_Linkcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_linkcopyfailed2 = /** @type {((inputs?: Contacts_Linkcopyfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Linkcopyfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_linkcopyfailed2(inputs)
	if (locale === "es") return es_contacts_linkcopyfailed2(inputs)
	if (locale === "fr") return fr_contacts_linkcopyfailed2(inputs)
	return ar_contacts_linkcopyfailed2(inputs)
});
export { contacts_linkcopyfailed2 as "contacts.linkCopyFailed" }