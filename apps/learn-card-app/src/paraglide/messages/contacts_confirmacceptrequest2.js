/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Confirmacceptrequest2Inputs */

const en_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to accept the connection request?`)
};

const es_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres aceptar la solicitud de conexión?`)
};

const fr_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment accepter la demande de connexion ?`)
};

const ar_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد قبول طلب الاتصال؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to accept the connection request?" |
*
* @param {Contacts_Confirmacceptrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_confirmacceptrequest2 = /** @type {((inputs?: Contacts_Confirmacceptrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmacceptrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmacceptrequest2(inputs)
	if (locale === "es") return es_contacts_confirmacceptrequest2(inputs)
	if (locale === "fr") return fr_contacts_confirmacceptrequest2(inputs)
	return ar_contacts_confirmacceptrequest2(inputs)
});
export { contacts_confirmacceptrequest2 as "contacts.confirmAcceptRequest" }