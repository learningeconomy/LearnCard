/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Sendrequest1Inputs */

const en_contacts_sendrequest1 = /** @type {(inputs: Contacts_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Request`)
};

const es_contacts_sendrequest1 = /** @type {(inputs: Contacts_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar solicitud`)
};

const fr_contacts_sendrequest1 = /** @type {(inputs: Contacts_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la demande`)
};

const ar_contacts_sendrequest1 = /** @type {(inputs: Contacts_Sendrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال طلب`)
};

/**
* | output |
* | --- |
* | "Send Request" |
*
* @param {Contacts_Sendrequest1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_sendrequest1 = /** @type {((inputs?: Contacts_Sendrequest1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Sendrequest1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_sendrequest1(inputs)
	if (locale === "es") return es_contacts_sendrequest1(inputs)
	if (locale === "fr") return fr_contacts_sendrequest1(inputs)
	return ar_contacts_sendrequest1(inputs)
});
export { contacts_sendrequest1 as "contacts.sendRequest" }