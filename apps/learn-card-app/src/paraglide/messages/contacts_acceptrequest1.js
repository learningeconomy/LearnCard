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

const de_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anfrage annehmen`)
};

const ar_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول الطلب`)
};

const fr_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter la demande`)
};

const ko_contacts_acceptrequest1 = /** @type {(inputs: Contacts_Acceptrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`요청 수락`)
};

/**
* | output |
* | --- |
* | "Accept Request" |
*
* @param {Contacts_Acceptrequest1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_acceptrequest1 = /** @type {((inputs?: Contacts_Acceptrequest1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Acceptrequest1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_acceptrequest1(inputs)
	if (locale === "es") return es_contacts_acceptrequest1(inputs)
	if (locale === "de") return de_contacts_acceptrequest1(inputs)
	if (locale === "ar") return ar_contacts_acceptrequest1(inputs)
	if (locale === "fr") return fr_contacts_acceptrequest1(inputs)
	return ko_contacts_acceptrequest1(inputs)
});
export { contacts_acceptrequest1 as "contacts.acceptRequest" }