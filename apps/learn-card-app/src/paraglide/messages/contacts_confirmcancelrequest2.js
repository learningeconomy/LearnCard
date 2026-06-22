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

const fr_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment annuler votre demande de connexion ?`)
};

const ar_contacts_confirmcancelrequest2 = /** @type {(inputs: Contacts_Confirmcancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إلغاء طلب الاتصال الخاص بك؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to cancel your connection request?" |
*
* @param {Contacts_Confirmcancelrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_confirmcancelrequest2 = /** @type {((inputs?: Contacts_Confirmcancelrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmcancelrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmcancelrequest2(inputs)
	if (locale === "es") return es_contacts_confirmcancelrequest2(inputs)
	if (locale === "fr") return fr_contacts_confirmcancelrequest2(inputs)
	return ar_contacts_confirmcancelrequest2(inputs)
});
export { contacts_confirmcancelrequest2 as "contacts.confirmCancelRequest" }