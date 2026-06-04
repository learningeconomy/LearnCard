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

const de_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Möchtest du die Verbindungsanfrage wirklich annehmen?`)
};

const ar_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد قبول طلب الاتصال؟`)
};

const fr_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment accepter la demande de connexion ?`)
};

const ko_contacts_confirmacceptrequest2 = /** @type {(inputs: Contacts_Confirmacceptrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 요청을 수락하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to accept the connection request?" |
*
* @param {Contacts_Confirmacceptrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_confirmacceptrequest2 = /** @type {((inputs?: Contacts_Confirmacceptrequest2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmacceptrequest2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmacceptrequest2(inputs)
	if (locale === "es") return es_contacts_confirmacceptrequest2(inputs)
	if (locale === "de") return de_contacts_confirmacceptrequest2(inputs)
	if (locale === "ar") return ar_contacts_confirmacceptrequest2(inputs)
	if (locale === "fr") return fr_contacts_confirmacceptrequest2(inputs)
	return ko_contacts_confirmacceptrequest2(inputs)
});
export { contacts_confirmacceptrequest2 as "contacts.confirmAcceptRequest" }