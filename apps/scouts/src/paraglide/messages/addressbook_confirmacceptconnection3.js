/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Confirmacceptconnection3Inputs */

const en_addressbook_confirmacceptconnection3 = /** @type {(inputs: Addressbook_Confirmacceptconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to accept the connection request?`)
};

const es_addressbook_confirmacceptconnection3 = /** @type {(inputs: Addressbook_Confirmacceptconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres aceptar la solicitud de conexión?`)
};

const fr_addressbook_confirmacceptconnection3 = /** @type {(inputs: Addressbook_Confirmacceptconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir accepter la demande de connexion ?`)
};

const ar_addressbook_confirmacceptconnection3 = /** @type {(inputs: Addressbook_Confirmacceptconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد من قبول طلب الاتصال؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to accept the connection request?" |
*
* @param {Addressbook_Confirmacceptconnection3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_confirmacceptconnection3 = /** @type {((inputs?: Addressbook_Confirmacceptconnection3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Confirmacceptconnection3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_confirmacceptconnection3(inputs)
	if (locale === "es") return es_addressbook_confirmacceptconnection3(inputs)
	if (locale === "fr") return fr_addressbook_confirmacceptconnection3(inputs)
	return ar_addressbook_confirmacceptconnection3(inputs)
});
export { addressbook_confirmacceptconnection3 as "addressBook.confirmAcceptConnection" }