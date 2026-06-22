/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Contacts_Contactcountone2Inputs */

const en_contacts_contactcountone2 = /** @type {(inputs: Contacts_Contactcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Contact`)
};

const es_contacts_contactcountone2 = /** @type {(inputs: Contacts_Contactcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contacto`)
};

const fr_contacts_contactcountone2 = /** @type {(inputs: Contacts_Contactcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contact`)
};

const ar_contacts_contactcountone2 = /** @type {(inputs: Contacts_Contactcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} جهة اتصال`)
};

/**
* | output |
* | --- |
* | "{count} Contact" |
*
* @param {Contacts_Contactcountone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_contactcountone2 = /** @type {((inputs: Contacts_Contactcountone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Contactcountone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_contactcountone2(inputs)
	if (locale === "es") return es_contacts_contactcountone2(inputs)
	if (locale === "fr") return fr_contacts_contactcountone2(inputs)
	return ar_contacts_contactcountone2(inputs)
});
export { contacts_contactcountone2 as "contacts.contactCountOne" }