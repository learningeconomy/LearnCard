/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Confirmcancelrequest2Inputs */

const en_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to cancel your connection request?`)
};

const es_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres cancelar tu solicitud de conexión?`)
};

const de_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Möchtest du deine Verbindungsanfrage wirklich abbrechen?`)
};

const ar_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إلغاء طلب الاتصال الخاص بك؟`)
};

const fr_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment annuler votre demande de connexion ?`)
};

const ko_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 요청을 취소하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to cancel your connection request?" |
*
* @param {Contacts_Confirmcancelrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_confirmcancelrequest2 = /** @type {((inputs?: Contacts_Confirmcancelrequest2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmcancelrequest2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmcancelrequest2(inputs)
	if (locale === "es") return es_contacts_confirmcancelrequest2(inputs)
	if (locale === "de") return de_contacts_confirmcancelrequest2(inputs)
	if (locale === "ar") return ar_contacts_confirmcancelrequest2(inputs)
	if (locale === "fr") return fr_contacts_confirmcancelrequest2(inputs)
	return ko_contacts_confirmcancelrequest2(inputs)
});
export { contacts_confirmcancelrequest2 as "contacts.confirmCancelRequest" }