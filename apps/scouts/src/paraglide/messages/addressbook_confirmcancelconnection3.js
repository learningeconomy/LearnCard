/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Confirmcancelconnection3Inputs */

const en_addressbook_confirmcancelconnection3 = /** @type {(inputs: Addressbook_Confirmcancelconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to cancel your connection request?`)
};

const es_addressbook_confirmcancelconnection3 = /** @type {(inputs: Addressbook_Confirmcancelconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres cancelar tu solicitud de conexión?`)
};

const fr_addressbook_confirmcancelconnection3 = /** @type {(inputs: Addressbook_Confirmcancelconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir annuler votre demande de connexion ?`)
};

const ar_addressbook_confirmcancelconnection3 = /** @type {(inputs: Addressbook_Confirmcancelconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد من إلغاء طلب الاتصال الخاص بك؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to cancel your connection request?" |
*
* @param {Addressbook_Confirmcancelconnection3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_confirmcancelconnection3 = /** @type {((inputs?: Addressbook_Confirmcancelconnection3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Confirmcancelconnection3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_confirmcancelconnection3(inputs)
	if (locale === "es") return es_addressbook_confirmcancelconnection3(inputs)
	if (locale === "fr") return fr_addressbook_confirmcancelconnection3(inputs)
	return ar_addressbook_confirmcancelconnection3(inputs)
});
export { addressbook_confirmcancelconnection3 as "addressBook.confirmCancelConnection" }