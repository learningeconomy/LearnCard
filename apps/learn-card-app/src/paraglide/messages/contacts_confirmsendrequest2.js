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

const de_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Möchtest du wirklich eine Verbindungsanfrage senden?`)
};

const ar_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إرسال طلب اتصال؟`)
};

const fr_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment envoyer une demande de connexion ?`)
};

const ko_contacts_confirmsendrequest2 = /** @type {(inputs: Contacts_Confirmsendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 요청을 보내시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to send a connection request?" |
*
* @param {Contacts_Confirmsendrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_confirmsendrequest2 = /** @type {((inputs?: Contacts_Confirmsendrequest2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmsendrequest2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmsendrequest2(inputs)
	if (locale === "es") return es_contacts_confirmsendrequest2(inputs)
	if (locale === "de") return de_contacts_confirmsendrequest2(inputs)
	if (locale === "ar") return ar_contacts_confirmsendrequest2(inputs)
	if (locale === "fr") return fr_contacts_confirmsendrequest2(inputs)
	return ko_contacts_confirmsendrequest2(inputs)
});
export { contacts_confirmsendrequest2 as "contacts.confirmSendRequest" }