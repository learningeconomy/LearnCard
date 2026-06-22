/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Contacts_Requestcountother2Inputs */

const en_contacts_requestcountother2 = /** @type {(inputs: Contacts_Requestcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Requests`)
};

const es_contacts_requestcountother2 = /** @type {(inputs: Contacts_Requestcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} solicitudes`)
};

const fr_contacts_requestcountother2 = /** @type {(inputs: Contacts_Requestcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} demandes`)
};

const ar_contacts_requestcountother2 = /** @type {(inputs: Contacts_Requestcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} طلبات`)
};

/**
* | output |
* | --- |
* | "{count} Requests" |
*
* @param {Contacts_Requestcountother2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_requestcountother2 = /** @type {((inputs: Contacts_Requestcountother2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Requestcountother2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_requestcountother2(inputs)
	if (locale === "es") return es_contacts_requestcountother2(inputs)
	if (locale === "fr") return fr_contacts_requestcountother2(inputs)
	return ar_contacts_requestcountother2(inputs)
});
export { contacts_requestcountother2 as "contacts.requestCountOther" }