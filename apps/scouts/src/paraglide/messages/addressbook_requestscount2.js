/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Addressbook_Requestscount2Inputs */

const en_addressbook_requestscount2 = /** @type {(inputs: Addressbook_Requestscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Requests`)
};

const es_addressbook_requestscount2 = /** @type {(inputs: Addressbook_Requestscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Solicitudes`)
};

const fr_addressbook_requestscount2 = /** @type {(inputs: Addressbook_Requestscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Demandes`)
};

const ar_addressbook_requestscount2 = /** @type {(inputs: Addressbook_Requestscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Requests`)
};

/**
* | output |
* | --- |
* | "{count} Requests" |
*
* @param {Addressbook_Requestscount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_requestscount2 = /** @type {((inputs: Addressbook_Requestscount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Requestscount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_requestscount2(inputs)
	if (locale === "es") return es_addressbook_requestscount2(inputs)
	if (locale === "fr") return fr_addressbook_requestscount2(inputs)
	return ar_addressbook_requestscount2(inputs)
});
export { addressbook_requestscount2 as "addressBook.requestsCount" }