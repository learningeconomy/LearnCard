/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Confirmsendrequest2Inputs */

const en_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to send a connection request?`)
};

const es_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres enviar una solicitud de conexión?`)
};

const fr_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment envoyer une demande de connexion ?`)
};

const ar_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إرسال طلب اتصال؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to send a connection request?" |
*
* @param {Contacts_Confirmsendrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_confirmsendrequest2 = /** @type {((inputs?: Contacts_Confirmsendrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmsendrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmsendrequest2(inputs)
	if (locale === "es") return es_contacts_confirmsendrequest2(inputs)
	if (locale === "fr") return fr_contacts_confirmsendrequest2(inputs)
	return ar_contacts_confirmsendrequest2(inputs)
});
export { contacts_confirmsendrequest2 as "contacts.confirmSendRequest" }