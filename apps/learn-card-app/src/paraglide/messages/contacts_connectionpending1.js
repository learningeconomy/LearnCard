/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Connectionpending1Inputs */

const en_contacts_connectionpending1 = /** @type {(inputs: Contacts_Connectionpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Pending`)
};

const es_contacts_connectionpending1 = /** @type {(inputs: Contacts_Connectionpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud pendiente`)
};

const fr_contacts_connectionpending1 = /** @type {(inputs: Contacts_Connectionpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande en attente`)
};

const ar_contacts_connectionpending1 = /** @type {(inputs: Contacts_Connectionpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الطلب قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "Request Pending" |
*
* @param {Contacts_Connectionpending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_connectionpending1 = /** @type {((inputs?: Contacts_Connectionpending1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectionpending1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectionpending1(inputs)
	if (locale === "es") return es_contacts_connectionpending1(inputs)
	if (locale === "fr") return fr_contacts_connectionpending1(inputs)
	return ar_contacts_connectionpending1(inputs)
});
export { contacts_connectionpending1 as "contacts.connectionPending" }