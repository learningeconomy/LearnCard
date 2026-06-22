/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Acceptrequest1Inputs */

const en_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept Request`)
};

const es_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar solicitud`)
};

const fr_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter la demande`)
};

const ar_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول الطلب`)
};

/**
* | output |
* | --- |
* | "Accept Request" |
*
* @param {Contacts_Acceptrequest1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_acceptrequest1 = /** @type {((inputs?: Contacts_Acceptrequest1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Acceptrequest1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_acceptrequest1(inputs)
	if (locale === "es") return es_contacts_acceptrequest1(inputs)
	if (locale === "fr") return fr_contacts_acceptrequest1(inputs)
	return ar_contacts_acceptrequest1(inputs)
});
export { contacts_acceptrequest1 as "contacts.acceptRequest" }