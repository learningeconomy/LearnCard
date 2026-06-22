/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Connectionsent1Inputs */

const en_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection Request sent`)
};

const es_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud de conexión enviada`)
};

const fr_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de connexion envoyée`)
};

const ar_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال طلب الاتصال`)
};

/**
* | output |
* | --- |
* | "Connection Request sent" |
*
* @param {Contacts_Connectionsent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_connectionsent1 = /** @type {((inputs?: Contacts_Connectionsent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectionsent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectionsent1(inputs)
	if (locale === "es") return es_contacts_connectionsent1(inputs)
	if (locale === "fr") return fr_contacts_connectionsent1(inputs)
	return ar_contacts_connectionsent1(inputs)
});
export { contacts_connectionsent1 as "contacts.connectionSent" }