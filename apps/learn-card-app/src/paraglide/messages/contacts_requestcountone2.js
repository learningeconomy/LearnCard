/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Contacts_Requestcountone2Inputs */

const en_contacts_requestcountone2 = /** @type {(inputs: Contacts_Requestcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Request`)
};

const es_contacts_requestcountone2 = /** @type {(inputs: Contacts_Requestcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} solicitud`)
};

const fr_contacts_requestcountone2 = /** @type {(inputs: Contacts_Requestcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} demande`)
};

const ar_contacts_requestcountone2 = /** @type {(inputs: Contacts_Requestcountone2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} طلب`)
};

/**
* | output |
* | --- |
* | "{count} Request" |
*
* @param {Contacts_Requestcountone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_requestcountone2 = /** @type {((inputs: Contacts_Requestcountone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Requestcountone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_requestcountone2(inputs)
	if (locale === "es") return es_contacts_requestcountone2(inputs)
	if (locale === "fr") return fr_contacts_requestcountone2(inputs)
	return ar_contacts_requestcountone2(inputs)
});
export { contacts_requestcountone2 as "contacts.requestCountOne" }